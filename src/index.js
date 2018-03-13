import './common.less';

import EventEmitter from 'events';
import merge from 'merge';
import utils from 'cg-component-utils';

/* For ES-Lint comment
 const DND_CLASS = 'cg-dnd';

 const CLASS = {
 DND: DND_CLASS,
 DRAG: `${DND_CLASS}-drag-item`
 };

 const KEY_CODE = {
 ESC: 27,
 TAB: 9
 }; */

/**
 * Accessible DnD Component
 */
class CgDnd extends EventEmitter {

  /**
   * DnD's customizing settings
   * @typedef {Object} DndSettings
   */
  static get DEFAULT_SETTINGS() {
    if (!this._DEFAULT_SETTINGS) {
      this._DEFAULT_SETTINGS = {
        disabled: false,
        bounds: '',
        helper: 'original',
        handler: '',
        snap: true,
        maxItemsInDropArea: 1,
        animateDuration: 500,
        alignRemainingDragItems: false,
        dragItems: [
          {
            node: '',
            data: null,
            ariaLabel: '',
            className: ''
          }
        ],
        dropAreas: [
          {
            node: '',
            ariaLabel: '',
            data: null,
            className: '',
            _isEmpty: true
          }
        ],
        onCreate: null,
        onDragStart: null,
        onDragMove: null,
        onDragStop: null
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  /**
   *
   * @property {string} CREATE - emit on drag creating
   * @return {Object} - events
   * @constructor
   */
  static get EVENTS() {
    if (!this._EVENTS) {
      this._EVENTS = {
        CREATE: 'create',
        DRAG_START: 'drag_start',
        DRAG_MOVE: 'drag_move',
        DRAG_STOP: 'drag_stop'
      };
    }

    return this._EVENTS;
  }

  static get EVENTS_HANDLER_RELATIONS() {
    if (!this._EVENTS_HANDLER_RELATIONS) {
      this._EVENTS_HANDLER_RELATIONS = {
        onCreate: this.EVENTS.CREATE,
        onDragStart: this.EVENTS.DRAG_START,
        onDragMove: this.EVENTS.DRAG_MOVE,
        onDragStop: this.EVENTS.DRAG_STOP
      };
    }

    return this._EVENTS_HANDLER_RELATIONS;
  }

  static get DEFAULT_ANIMATION_PARAMS() {
    if (!this._DEFAULT_ANIMATION_PARAMS) {
      this._DEFAULT_ANIMATION_PARAMS = {
        animatedProperty: 'transform',
        duration: 500,
        func: 'ease',
        delay: 0
      };
    }

    return this._DEFAULT_ANIMATION_PARAMS;
  }

  /**
   * @param {DndSettings} settings - Dnd's settings, all undefined settings will be taken from {@link CgDnd.DEFAULT_SETTINGS}
   * @constructor
   */
  constructor(settings) {
    super();

    this._applySettings(settings);

    this._setAdditionalPropertiesForDragElems();

    // This._render();

    this._addListeners();
  }

  /**
   * Add event listeners
   * @private
   */
  _addListeners() {
    this.EVENTS = this.constructor.EVENTS;

    this.settings.dragItems.forEach((item) => {
      item.dragHandler.addEventListener('mousedown', (e) => this._onMouseDown(e, item));
    });
  }

  _onMouseDown(e, item) {
    const draggedNode = item.node;
    const box = draggedNode.getBoundingClientRect();
    const shiftX = e.pageX - box.left + draggedNode.offsetLeft;
    const shiftY = e.pageY - box.top + draggedNode.offsetTop;

    // TODO: (early dnd) fix max height, when bounds = document, fix functionality and productivity

    let boundsParams;

    if (this.settings.bounds === document) {
      const trueDocumentParams = document.documentElement.getBoundingClientRect();

      boundsParams = merge({}, trueDocumentParams, {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      });
      // Console.log(boundsParams);
      /*
       {
       left: trueDocumentParams.left,
       top: trueDocumentParams.top,
       width: document.documentElement.clientWidth,
       height: document.documentElement.clientHeight
       };*/
    } else {
      boundsParams = this.settings.bounds.getBoundingClientRect();
    }

    this.currentDragParams = {
      draggedItem: item,
      xShift: shiftX,
      yShift: shiftY,
      trueBounds: {
        x0: boundsParams.left + e.pageX - box.left,
        y0: boundsParams.top + e.pageY - box.top,
        x1: boundsParams.width + boundsParams.left - (box.left + box.width - e.pageX),
        y1: boundsParams.height + boundsParams.top - (box.top + box.height - e.pageY)
      }
    };

    this.onMouseMoveHandler = this._onMouseMove.bind(this);
    this.onMouseUpHandler = this._onMouseUp.bind(this);

    document.addEventListener('mousemove', this.onMouseMoveHandler);
    document.addEventListener('mouseup', this.onMouseUpHandler);

    if (this.settings.onDragStart) {
      this.emit(this.constructor.EVENTS.DRAG_START, e, item);
    }
  }

  _onMouseMove(e) {
    const {
            trueBounds: currentBounds,
            xShift: shiftX,
            yShift: shiftY,
            draggedItem
          } = this.currentDragParams;

    const xPos = (e.pageX >= currentBounds.x1 ? currentBounds.x1 : e.pageX <= currentBounds.x0 ? currentBounds.x0 : e.pageX) - shiftX;
    const yPos = (e.pageY >= currentBounds.y1 ? currentBounds.y1 : e.pageY <= currentBounds.y0 ? currentBounds.y0 : e.pageY) - shiftY;

    this.translateNodeTo(draggedItem.node, xPos, yPos);

    if (this.settings.onDragMove) {
      this.emit(this.constructor.EVENTS.DRAG_MOVE, e, draggedItem);
    }
  }

  _onMouseUp(e) {
    document.removeEventListener('mousemove', this.onMouseMoveHandler);
    document.removeEventListener('mouseup', this.onMouseUpHandler);

    this._checkDragItemPosition(this.currentDragParams.draggedItem);

    if (this.settings.onDragStart) {
      this.emit(this.constructor.EVENTS.DRAG_STOP, e, this.currentDragParams.item);
    }
  }

  /**
   * Checks, is drop area was intersects by drag item. If it's true and settings.snap is true,
   * then align drag item by drop area, else move drag item to default position
   * @param {object} dragItem
   * @private
   */
  _checkDragItemPosition(dragItem) {
    let chosenDropArea;

    for (let i = 0; i < this.settings.dropAreas.length; i++) {
      if (this._checkIntersection(dragItem, this.settings.dropAreas[i])) {
        chosenDropArea = this.settings.dropAreas[i];
        break;
      }
    }

    if (chosenDropArea) {
      if (this.settings.snap) {
        const xPos = chosenDropArea.nodeCoordinates.x0 - dragItem.defaultCoordinates.x0;
        const yPos = chosenDropArea.nodeCoordinates.y0 - dragItem.defaultCoordinates.y0;

        this.translateNodeTo(dragItem.node, xPos, yPos, true, { duration: this.settings.animateDuration });
      }

      dragItem.dropArea = chosenDropArea;
      chosenDropArea._isEmpty = false;

      const inRemainingItemsIndex = this.remainingDragItems.indexOf(dragItem);

      if (inRemainingItemsIndex !== -1) {
        this.remainingDragItems.splice(inRemainingItemsIndex, 1);
        this._shiftRemainingDragItems();
        this.resetNeighbors(dragItem);
      }
    } else {
      this.translateNodeTo(dragItem.node, 0, 0, true, { duration: this.settings.animateDuration });

      if (dragItem.dropArea) {
        // ToDo: add checking on multiple possible drag items
        dragItem.dropArea = null;
      }

      if (this.remainingDragItems.indexOf(dragItem) === -1) {
        this.remainingDragItems.push(dragItem);
        this.remainingDragItems.sort((elem1, elem2) => elem1.index - elem2.index);
      }

      this._shiftRemainingDragItems();
    }
  }

  /**
   * Checks, is drop area was intersects by drag item
   * @param {object} dragItem
   * @param {object} dropArea
   * @return {boolean} - return intersection result (true/false)
   * @private
   */
  _checkIntersection(dragItem, dropArea) {
    dragItem.nodeCoordinates = this._getHTMLNodePosition(dragItem.node);
    dropArea.nodeCoordinates = this._getHTMLNodePosition(dropArea.node);

    const checkedPoints = [['x0', 'y0'], ['x0', 'y1'], ['x1', 'y1'], ['x1', 'y0']];
    const POINTS_COUNT = checkedPoints.length;
    let isIntersect = false;

    for (let i = 0; i < POINTS_COUNT; i++) {
      isIntersect = this._isPointInsideRect({
        x: dragItem.nodeCoordinates[checkedPoints[i][0]],
        y: dragItem.nodeCoordinates[checkedPoints[i][1]]
      }, dropArea.nodeCoordinates);

      if (isIntersect) {
        break;
      }
    }

    return isIntersect;
  }

  /**
   * Checks, is point crosses html-rect
   * @param {object} checkedPoint - point coordinates
   * @param {object} rect - rect angles coordinates
   * @return {boolean} - return intersection result (true/false)
   * @private
   */
  _isPointInsideRect(checkedPoint, rect) {
    return checkedPoint.x >= rect.x0 && checkedPoint.x <= rect.x1 && checkedPoint.y >= rect.y0 && checkedPoint.y <= rect.y1;
  }

  /**
   * Set new relations of remaining drag items for future keyboard access
   * @param {object} draggedItem - drag item, which set to drop area
   */
  resetNeighbors(draggedItem) {
    draggedItem.prevNeighbor.nextNeighbor = draggedItem.nextNeighbor;
    draggedItem.nextNeighbor.prevNeighbor = draggedItem.prevNeighbor;

    if (draggedItem.isFirstItem) {
      draggedItem.nextNeighbor.isFirstItem = true;
    }
  }

  /**
   * Align remaining free drag items
   */
  _shiftRemainingDragItems() {
    if (this.settings.alignDragItems) {
      this.remainingDragItems.forEach((item, index) => {
        const x = this.initDragItemsPlaces[index].x0 - item.defaultCoordinates.x0;
        const y = this.initDragItemsPlaces[index].y0 - item.defaultCoordinates.y0;

        this.translateNodeTo(item.node, x, y, true);
      });
    }
  }

  /**
   * Moves html-node element to (x, y) coordinates by transform: translate with/without animation
   * @param {node} node - html-node.
   * @param {number} x
   * @param {number} y
   * @param {boolean} isAnimate - animate flag
   * @param {object} animateParams - params for css-transition
   * @public
   */
  translateNodeTo(node, x, y, isAnimate, animateParams) {
    const props = merge({}, this.constructor.DEFAULT_ANIMATION_PARAMS, animateParams);

    if (isAnimate) {
      node.style.transition = `${props.animatedProperty} ${props.duration}ms ${props.func} ${props.delay}ms`;

      setTimeout(() => {
        node.style.transition = '';
      }, props.duration + props.delay);
    }

    node.style.transform = `translate(${x}px, ${y}px)`;
  }

  /**
   * Checks and fix HTML Element or Selector string.
   * @param {string|Element} value - checked string.
   * @param {boolean} byID - if true - we'll find Element by ID, otherwise we'll find it by class.
   * @param {Element} container - HTML-container in which we'll try find checked value
   * @param {boolean} allowEmpty - if true, function'll get possible empty selector string, otherwise error'll show
   * @return {Element|null} - return HTML Element node or null, if it wasn't found
   * @private
   */
  _getHTMLNodeElement(value, byID, container = document, allowEmpty = false) {
    let htmlNode = null;

    if (typeof value === 'string' && value.length) {
      const selector = byID ? this._checkIDSelector(value) : this._fixClassSelector(value);

      htmlNode = container.querySelector(selector);
    } else if (value instanceof Element) {
      htmlNode = value;
    }

    if (!htmlNode && !allowEmpty) {
      throw new Error(`${value} wasn't found!`);
    }

    return htmlNode;
  }

  /**
   * Merge user settings with default settings
   * @param {DndSettings} settings
   * @private
   */
  _applySettings(settings) {
    /**
     * @type DndSettings
     */
    this.settings = merge({}, this.constructor.DEFAULT_SETTINGS, settings);

    for (const key in this.settings) {
      if (this.settings.hasOwnProperty(key)) {
        this.settings[key] = this._checkSetting(key, this.settings[key]);
      }
    }

    this.remainingDragItems = [...this.settings.dragItems];
    this.initDragItemsPlaces = [];
    this.settings.dragItems.forEach((item, index) => {
      this.initDragItemsPlaces[index] = merge({}, {}, item.defaultCoordinates);
    });
  }

  /**
   * Checks and fix user settings
   * @param {string} settingName - checked property.
   * @param {string|number|object|boolean} settingValue - checked property value
   * @param {Element} elemNode - HTML-Element for setting HTML-attributes and HTML-classes
   * @return {string|number|object|boolean} - return verified value
   * @private
   */
  _checkSetting(settingName, settingValue, elemNode) {
    let verifiedValue;
    let isNodeAttrribute = false;
    let isNodeClassName = false;

    switch (settingName) {
      case 'dragItems':
      case 'dropAreas':
        if (Array.isArray(settingValue) && settingValue.length) {
          let items = [...settingValue];

          items = items.map((item) => {
            let mergedItem;

            if (typeof item === 'object') {
              const templateDnDElement = settingName === 'dragItems'
                ? this.constructor.DEFAULT_SETTINGS.dragItems[0]
                : this.constructor.DEFAULT_SETTINGS.dropAreas[0];

              mergedItem = merge({}, templateDnDElement, item);

              // We search elements nodes by first, because then we set params to them
              if (mergedItem.hasOwnProperty('node')) {
                mergedItem.node = this._getHTMLNodeElement(mergedItem.node, true);
              } else {
                throw new Error('Element must have node property');
              }

              for (const key in mergedItem) {
                if (mergedItem.hasOwnProperty(key) && key !== 'node') {
                  mergedItem[key] = this._checkSetting(key, mergedItem[key], mergedItem.node);
                }
              }

              mergedItem.defaultCoordinates = this._getHTMLNodePosition(mergedItem.node);
            } else {
              this._showSettingError(settingName, settingValue, `Please set object in each element of ${settingName}.`);
            }

            return mergedItem;
          });

          verifiedValue = items;
        } else {
          this._showSettingError(settingName, settingValue, `Please set Array of ${settingName}.`);
        }
        break;
      case 'className':
        isNodeClassName = true;
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
        } else {
          this._showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      case 'bounds':

        // TODO: translate ndoeElement in array of bounds coordinates

        verifiedValue = this._getHTMLNodeElement(settingValue, true, document, true) || document;
        break;
      case 'helper':
        verifiedValue = settingValue.toLowerCase() === 'clone' ? 'clone' : this.constructor.DEFAULT_SETTINGS.helper;
        break;
      case 'handler':
        if (typeof settingValue === 'string') {
          if (settingValue.length) {
            verifiedValue = this._fixClassSelector(settingValue);
          }
        } else {
          this._showSettingError(settingName, settingValue, 'Please set class selector string.');
        }
        break;
      case 'snap':
      case 'disabled':
      case 'alignDragItems':
        verifiedValue = this._checkOnBoolean(settingValue);

        if (verifiedValue === null) {
          this._showSettingError(settingName, settingValue, 'Please set true or false.');
        }
        break;
      case 'ariaLabel':
        isNodeAttrribute = true;
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue;
        } else {
          this._showSettingError(settingName, settingValue, 'Please set string.');
        }
        break;
      case 'onCreate':
      case 'onDragStart':
      case 'onDragMove':
      case 'onDragStop':
        if (typeof settingValue === 'function') {
          verifiedValue = settingValue;
          this.on(this.constructor.EVENTS_HANDLER_RELATIONS[settingName], settingValue);
        } else if (settingValue !== null) {
          this._showSettingError(settingName, settingValue, 'Please set function as event handler.');
        }
        break;
      case 'animateDuration':
        verifiedValue = +settingValue;

        if (!verifiedValue || isNaN(verifiedValue)) {
          this._showSettingError(settingName, settingValue, 'Please set number for animation duration value');
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    if (isNodeClassName && verifiedValue.length) {
      utils.addClass(elemNode, verifiedValue);
    }
    if (isNodeAttrribute && verifiedValue.length) {
      elemNode.setAttribute('aria-label', verifiedValue);
    }

    return verifiedValue;
  }

  /**
   * Shows error in console.
   * @param {string} settingName - name of setting property.
   * @param {string|number|object|boolean} settingValue - wrong value
   * @param {string} validMessage - message, which contains correct value type
   * @private
   */
  _showSettingError(settingName, settingValue, validMessage) {
    const errorValue = typeof settingValue === 'string' ? settingValue : typeof settingValue;

    throw new Error(`${errorValue} isn't valid value for ${settingName}! ${validMessage}`);
  }

  /**
   * Set drag-handlers for each drag item, if Element was got, otherwise set drag-item as drag-handler
   * @private
   */
  _setAdditionalPropertiesForDragElems() {
    const dragItemsLength = this.settings.dragItems.length;

    this.settings.dragItems[0].prevNeighbor = this.settings.dragItems[dragItemsLength - 1];
    this.settings.dragItems[0].isFirstItem = true;
    this.settings.dragItems[dragItemsLength - 1].nextNeighbor = this.settings.dragItems[0];
    this.settings.dragItems[dragItemsLength - 1].isLastItem = true;

    this.settings.dragItems.forEach((item, index) => {
      item.dragHandler = this._getHTMLNodeElement(this.settings.handler, false, item.node, true) || item.node;

      if (!item.nextNeighbor) {
        item.nextNeighbor = this.settings.dragItems[index + 1];
      }
      if (!item.prevNeighbor) {
        item.prevNeighbor = this.settings.dragItems[index - 1];
      }

      item.index = index;
    });
  }

  /**
   * Get node rect angles coordinates.
   * @param {node} node - html-node.
   * @return {object} - rect coordinates
   * @private
   */
  _getHTMLNodePosition(node) {
    const domRect = node.getBoundingClientRect();

    return {
      x0: domRect.left,
      y0: domRect.top,
      x1: domRect.left + domRect.width,
      y1: domRect.top + domRect.height
    };
  }

  /**
   * Checks and fix ID selector string.
   * @param {string} selectorString - checked string.
   * @return {string} - return valid ID selector string
   * @private
   */
  _checkIDSelector(selectorString) {
    if (selectorString.search(/^\./) !== -1) {
      throw new Error('ID selector was expected, but Class selector was found');
    }

    return selectorString.search(/^#/) === -1 ? `#${selectorString}` : selectorString;
  }

  /**
   * Checks and fix class selector string.
   * @param {string} selectorString - checked string.
   * @return {string} - return valid class selector string
   * @private
   */
  _fixClassSelector(selectorString) {
    if (selectorString.search(/^#/) !== -1) {
      throw new Error('Class selector was expected, but ID selector was found');
    }

    return selectorString.search(/^\./) === -1 ? `.${selectorString}` : selectorString;
  }

  /**
   * Checks user setting's boolean values.
   * @param {boolean|string|number} value - checked value.
   * @return {boolean|null} - return boolean value or null
   * @private
   */
  _checkOnBoolean(value) {
    let boolElem = null;

    if (typeof value === 'string') {
      boolElem = value.search(/^true$/i) !== -1 ? true : value.search(/^false$/i) !== -1 ? false : null;
    } else {
      boolElem = !!value;
    }

    return boolElem;
  }

  /**
   * Create DOM elements
   * @private
   */
  /* For ES-Lint comment
   _render() {

   } */

  /**
   * Disable drag
   * @param {boolean} [disabled = true]
   */
  /* For ES-Lint comment
   disable(disabled = true) {

   }

   reset() {

   }

   destroy() {

   } */
}

export default CgDnd;
