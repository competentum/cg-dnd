import './common.less';

import EventEmitter from 'events';
import merge from 'merge';
// Import cgUtils from 'cg-component-utils';
import localUtils from 'utils';
import DragItem from 'DragItem';
import DropArea from 'DropArea';

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
        alignRemainingDragItems: false,
        dropAreas: [
          {
            node: '',
            ariaLabel: '',
            data: null,
            className: '',
            _isEmpty: true
          }
        ],
        animationParams: {
          animatedProperty: 'transform',
          duration: 500,
          timingFunction: 'ease',
          delay: 0
        },
        onCreate: () => {},
        onDragStart: () => {},
        onDragMove: () => {},
        onDragStop: () => {}
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
    this.settings.dragItems.forEach((item) => {
      item.handler.addEventListener('mousedown', (e) => this._onMouseDown(e, item));
      item.handler.addEventListener('touchstart', (e) => this._onMouseDown(e, item), { passive: false });
    });

    this.on(DragItem.EVENTS.DRAG_ITEM_RESET, this._onDragItemReset);
  }

  _onMouseDown(e, item) {
    e.preventDefault();

    const draggedNode = item.node;
    const box = draggedNode.getBoundingClientRect();
    let boundsParams;

    item.shiftX = e.pageX - box.left + draggedNode.offsetLeft;
    item.shiftY = e.pageY - box.top + draggedNode.offsetTop;

    // TODO: (early dnd) fix max height, when bounds = document, fix functionality and productivity

    if (this.settings.bounds === document) {
      const trueDocumentParams = document.documentElement.getBoundingClientRect();

      boundsParams = merge({}, localUtils.translateDOMRectToObject(trueDocumentParams), {
        bottom: document.documentElement.clientHeight
      });
    } else {
      boundsParams = this.settings.bounds instanceof Element ? this.settings.bounds.getBoundingClientRect() : this.settings.bounds;
    }

    this.currentDragParams = {
      draggedItem: item,
      trueBounds: localUtils.calculateCurrentBounds(box, boundsParams, e.pageX, e.pageY)
    };

    this.onMouseMoveHandler = this._onMouseMove.bind(this);
    this.onMouseUpHandler = this._onMouseUp.bind(this);

    document.addEventListener('mousemove', this.onMouseMoveHandler);
    document.addEventListener('touchmove', this.onMouseMoveHandler, { passive: false });
    document.addEventListener('mouseup', this.onMouseUpHandler);
    document.addEventListener('touchend', this.onMouseUpHandler, { passive: false });

    this.emit(this.constructor.EVENTS.DRAG_START, e, item);
  }

  _onMouseMove(e) {
    e.preventDefault();

    const x = localUtils.applyLimit(e.pageX, this.currentDragParams.trueBounds.left, this.currentDragParams.trueBounds.right);
    const y = localUtils.applyLimit(e.pageY, this.currentDragParams.trueBounds.top, this.currentDragParams.trueBounds.bottom);

    this.currentDragParams.draggedItem.translateTo(x - this.currentDragParams.draggedItem.shiftX,
                                                   y - this.currentDragParams.draggedItem.shiftY);

    this.emit(this.constructor.EVENTS.DRAG_MOVE, e, this.currentDragParams.draggedItem);
  }

  _onMouseUp(e) {
    e.preventDefault();

    document.removeEventListener('mousemove', this.onMouseMoveHandler);
    document.removeEventListener('touchmove', this.onMouseMoveHandler, { passive: false });
    document.removeEventListener('mouseup', this.onMouseUpHandler);
    document.removeEventListener('touchend', this.onMouseUpHandler, { passive: false });

    this._checkDragItemPosition(this.currentDragParams.draggedItem);

    const dragItem = this.currentDragParams.draggedItem;

    this.emit(this.constructor.EVENTS.DRAG_STOP, e, dragItem, dragItem.chosenDropArea);
  }

  _onDragItemReset(dragItem) {
    if (dragItem.chosenDropArea) {
      // ToDo: add checking on multiple possible drag items
      dragItem.chosenDropArea = null;
    }

    if (this.remainingDragItems.indexOf(dragItem) === -1) {
      // If dropped dragItem is on dropArea and remaining drag items array includes it, we remove it from remaining drag items array
      this.remainingDragItems.push(dragItem);

      if (this.remainingDragItems.length > 1) {
        this.remainingDragItems.sort((elem1, elem2) => elem1.index - elem2.index);
      }
    }

    this._shiftRemainingDragItems();
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
      // Drag item was dropped on drop area

      if (this.settings.snap) {
        const x = chosenDropArea.coordinates.default.left - dragItem.coordinates.default.left;
        const y = chosenDropArea.coordinates.default.top - dragItem.coordinates.default.top;

        dragItem.translateTo(x, y, true);
      }

      dragItem.chosenDropArea = chosenDropArea;
      chosenDropArea._isEmpty = false;

      const inRemainingItemsIndex = this.remainingDragItems.indexOf(dragItem);

      if (inRemainingItemsIndex !== -1) {
        // If dropped dragItem isn't on dropArea and remaining drag items array doesn't include it, we add it to remaining drag items array
        this.remainingDragItems.splice(inRemainingItemsIndex, 1);
        this._shiftRemainingDragItems();
        this._reSetSiblings(dragItem);
      }
    } else {
      // Drag item wasn't dropped on drop area

      dragItem.reset();
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
    dragItem.updateCurrentCoordinates();
    dropArea.updateDefaultCoordinates();

    return localUtils.isIntersectRect(dragItem.coordinates.current, dropArea.coordinates.default);
  }

  /**
   * Set new relations of remaining drag items for future keyboard access
   * @param {object} draggedItem - drag item, which set to drop area
   */
  _reSetSiblings(draggedItem) {
    draggedItem.siblings.prev.siblings.next = draggedItem.siblings.next;
    draggedItem.siblings.next.siblings.prev = draggedItem.siblings.prev;

    if (draggedItem.isFirstItem) {
      draggedItem.siblings.next.isFirstItem = true;
    }
  }

  /**
   * Align remaining free drag items
   * @private
   */
  _shiftRemainingDragItems() {
    // TODO: add changes checking
    if (this.settings.alignDragItems) {
      this.remainingDragItems.forEach((item, index) => {
        const x = this.initDragItemsPlaces[index].left - item.coordinates.default.left;
        const y = this.initDragItemsPlaces[index].top - item.coordinates.default.top;

        item.translateTo(x, y, true);
        item.updateCurrentCoordinates();
        item.updateCurrentStartCoordinates();
      });
    }
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
    this.settings = merge.recursive({}, this.constructor.DEFAULT_SETTINGS, settings);
    this.dragSettings = settings.dragItems;

    for (const key in this.settings) {
      if (this.settings.hasOwnProperty(key)) {
        this.settings[key] = this._checkSetting(key, this.settings[key]);
      }
    }

    DragItem.mainDnDEmitter = this;

    this.remainingDragItems = [...this.settings.dragItems];
    this.initDragItemsPlaces = [];
    this.settings.dragItems.forEach((item, index) => {
      this.initDragItemsPlaces[index] = merge({}, {}, localUtils.translateDOMRectToObject(item.coordinates.default));
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
  _checkSetting(settingName, settingValue) {
    const BOUNDS_ARRAY_LENGTH = 4;
    let verifiedValue;

    switch (settingName) {
      case 'dragItems':
      case 'dropAreas':
        if (Array.isArray(settingValue) && settingValue.length) {
          verifiedValue = settingValue.map((settings) => {
            let dndElement;

            if (typeof settings === 'object') {
              dndElement = settingName === 'dragItems' ? new DragItem(settings, this) : new DropArea(settings);
            } else {
              localUtils.showSettingError(settingName, settingValue, `Please set object in each element of ${settingName}.`);
            }

            return dndElement;
          });
        } else {
          localUtils.showSettingError(settingName, settingValue, `Please set Array of ${settingName}.`);
        }
        break;
      case 'bounds':
        if (Array.isArray(settingValue)) {
          const isValidBoundsArray = settingValue.length === BOUNDS_ARRAY_LENGTH
                                     && settingValue.every((item) => !isNaN(+item) && item >= 0)
                                     && (settingValue[0] < settingValue[2] && settingValue[1] < settingValue[3]);

          if (!isValidBoundsArray) {
            localUtils.showSettingError(settingName, settingValue, 'Please set array of 4 positive numbers as [x0, y0, x1, y1]');
          }
          verifiedValue = {
            left: settingValue[0],
            top: settingValue[1],
            right: settingValue[2],
            bottom: settingValue[3]
          };
        } else {
          verifiedValue = localUtils.getElement(settingValue) || document;
        }
        break;
      case 'helper':
        verifiedValue = settingValue.toLowerCase() === 'clone' ? 'clone' : this.constructor.DEFAULT_SETTINGS.helper;
        break;
      case 'handler':
        if (typeof settingValue === 'string') {
          if (settingValue.length) {
            verifiedValue = localUtils.checkClassSelector(settingValue);
          }
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set class selector string.');
        }
        break;
      case 'snap':
      case 'disabled':
      case 'alignDragItems':
        verifiedValue = localUtils.checkOnBoolean(settingValue);

        if (verifiedValue === null) {
          localUtils.showSettingError(settingName, settingValue, 'Please set true or false.');
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
          localUtils.showSettingError(settingName, settingValue, 'Please set function as event handler.');
        }
        break;
      case 'animationParams':
        if (typeof settingValue === 'object') {
          for (const key in settingValue) {
            if (settingValue.hasOwnProperty(key)) {
              settingValue[key] = this._checkSetting(key, settingValue[key]);
            }
          }

          verifiedValue = settingValue;
          DragItem.animationParams = verifiedValue;
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set object of css animataion settings.');
        }
        break;
      case 'delay':
      case 'duration':
        verifiedValue = +settingValue;

        if (!verifiedValue && verifiedValue !== 0 || isNaN(verifiedValue)) {
          localUtils.showSettingError(settingName, settingValue, `Please set number for animation ${settingName} value in ms`);
        }
        break;
      case 'animatedProperty':
      case 'timingFunction':
        if (typeof settingValue === 'string' && settingValue.length) {
          verifiedValue = settingValue;
        } else {
          localUtils.showSettingError(settingName, settingValue, `Please string of ${settingName}.`);
        }
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  /**
   * Set drag-handlers for each drag item, if Element was got, otherwise set drag-item as drag-handler
   * @private
   */
  _setAdditionalPropertiesForDragElems() {
    const dragItemsLength = this.settings.dragItems.length;

    this.settings.dragItems[0].siblings.prev = this.settings.dragItems[dragItemsLength - 1];
    this.settings.dragItems[0].isFirstItem = true;
    this.settings.dragItems[dragItemsLength - 1].siblings.next = this.settings.dragItems[0];
    this.settings.dragItems[dragItemsLength - 1].isLastItem = true;

    this.settings.dragItems.forEach((item, index) => {
      if (!item.handler) {
        item.handler = localUtils.getElement(this.settings.handler, item.node) || item.node;
      }

      if (!item.siblings.next) {
        item.siblings.next = this.settings.dragItems[index + 1];
      }
      if (!item.siblings.prev) {
        item.siblings.prev = this.settings.dragItems[index - 1];
      }

      item.index = index;
    });
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
