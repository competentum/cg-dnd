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
        possibleToReplaceItem: false,
        dropAreas: [
          {
            node: '',
            ariaLabel: '',
            data: null,
            className: '',
          }
        ],
        animationParams: {
          animatedProperty: 'transform',
          duration: 500,
          timingFunction: 'ease',
          delay: 0
        },
        snapAlignParams: {
          horizontalAlign: 'left',
          verticalAlign: 'top'
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
        DRAG_STOP: 'drag_stop',
        KEY_DOWN: 'keydown'
      };
    }

    return this._EVENTS;
  }

  static get KEY_CODES() {
    if (!this._KEY_CODES) {
      this._KEY_CODES = {
        ENTER: 13,
        SPACE: 32,
        UP_ARROW: 38,
        DOWN_ARROW: 40
      };
    }

    return this._KEY_CODES;
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

    this._setSiblings(this.settings.dragItems);
    this._setSiblings(this.settings.dropAreas);
    this.currentFirstDragItem = this.settings.dragItems[0];
    this.currentFirstDropArea = this.settings.dropAreas[0];

    // This._render();

    this._addListeners();

    this.emit(this.constructor.EVENTS.CREATE, this);
  }

  set currentFirstDragItem(dragItem) {
    if (this._currentFirstDragItem) {
      this._currentFirstDragItem.tabIndex = -1;
    }

    this._currentFirstDragItem = dragItem;
    this._currentFirstDragItem.tabIndex = 0;
  }

  get currentFirstDragItem() {
    return this._currentFirstDragItem;
  }

  set currentFirstDropArea(dropArea) {
    this._currentFirstDropArea = dropArea;
  }

  get currentFirstDropArea() {
    return this._currentFirstDropArea;
  }

  /**
   * Add event listeners
   * @private
   */
  _addListeners() {
    this.deviceEvents = localUtils.getDeviceEvents();

    this.settings.dragItems.forEach((item) => {
      item.onMouseDownHandler = this._onMouseDown.bind(this, item);

      item.handler.addEventListener(this.deviceEvents.dragStart, item.onMouseDownHandler, { passive: false });
      item.node.addEventListener('keydown', this._onKeyDown.bind(this, item));
      item.node.addEventListener('click', this._onDragItemClick.bind(this, item));
    });

    this.settings.dropAreas.forEach((area) => {
      area.node.addEventListener('keydown', this._onKeyDown.bind(this, area));
      area.node.addEventListener('click', this._onDropAreaClick.bind(this, area));
    });

    this.on(DragItem.EVENTS.DRAG_ITEM_RESET, this._onDragItemReset);
  }

  _onMouseDown(item, e) {
    e.preventDefault();

    this.isClick = true;

    const draggedNode = item.node;
    const box = localUtils.getElementPosition(draggedNode);
    let boundsParams;

    item.shiftX = e.pageX - box.left;
    item.shiftY = e.pageY - box.top;

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
      currentBounds: localUtils.calculateCurrentBounds(box, boundsParams, e.pageX, e.pageY)
    };

    this.onMouseMoveHandler = this._onMouseMove.bind(this);
    this.onMouseUpHandler = this._onMouseUp.bind(this);

    document.addEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler, { passive: false });
    document.addEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler, { passive: false });

    this.emit(this.constructor.EVENTS.DRAG_START, e, item);
  }

  _onMouseMove(e) {
    e.preventDefault();

    this.isClick = false;

    const x = localUtils.applyLimit(e.pageX, this.currentDragParams.currentBounds.left, this.currentDragParams.currentBounds.right);
    const y = localUtils.applyLimit(e.pageY, this.currentDragParams.currentBounds.top, this.currentDragParams.currentBounds.bottom);

    this.currentDragParams.draggedItem.translateTo({
      x: x - this.currentDragParams.draggedItem.shiftX,
      y: y - this.currentDragParams.draggedItem.shiftY
    });

    this.emit(this.constructor.EVENTS.DRAG_MOVE, e, this.currentDragParams.draggedItem);
  }

  _onMouseUp(e) {
    e.preventDefault();

    document.removeEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler, { passive: false });
    document.removeEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler, { passive: false });

    this._checkDragItemPosition(this.currentDragParams.draggedItem);

    const dragItem = this.currentDragParams.draggedItem;

    this.emit(this.constructor.EVENTS.DRAG_STOP, e, dragItem, dragItem.chosenDropArea);
  }

  _onDragItemReset(dragItem) {
    if (dragItem.chosenDropArea) {
      dragItem.chosenDropArea.excludeDragItem(dragItem);
    }

    if (this.remainingDragItems.indexOf(dragItem) === -1) {
      // If dropped dragItem is on dropArea and remaining drag items array includes it, we remove it from remaining drag items array
      this.remainingDragItems.push(dragItem);

      if (this.remainingDragItems.length > 1) {
        this.remainingDragItems.sort((elem1, elem2) => elem1.index - elem2.index);
      }

      if (this._currentFirstDragItem !== this.remainingDragItems[0]) {
        this.currentFirstDragItem = this.remainingDragItems[0];
      }
    }

    this._shiftRemainingDragItems();
  }

  _onKeyDown(item, e) {
    // E.preventDefault();

    const KEY_CODES = this.constructor.KEY_CODES;

    switch (e.keyCode) {
      case KEY_CODES.UP_ARROW:
        if (item.siblings.prev) {
          item.siblings.prev.node.focus();
        }
        break;
      case KEY_CODES.DOWN_ARROW:
        if (item.siblings.next) {
          item.siblings.next.node.focus();
        }
        break;
      case KEY_CODES.ENTER:
      case KEY_CODES.SPACE:
        this.isClick = true;
        item.node.click();
        break;
      default:
    }
  }

  _onDragItemClick(item, e) {
    if (this.isClick) {
      this.currentDragParams = { draggedItem: item };

      if (!item.chosenDropArea) {
        this._currentFirstDropArea.node.focus();
      } else if (this.settings.possibleToReplaceItem) {
        // Item.reset();
        this._currentFirstDropArea.node.focus();
      }

      this.emit(this.constructor.EVENTS.DRAG_START, e, item);
    }
  }

  _onDropAreaClick(area, e) {
    if (this.isClick) {
      if (this.currentDragParams.draggedItem) {
        if (!this.settings.snap) {
          this.currentDragParams.draggedItem.translateTo(area.coordinates.default, true);
        }

        this._putDragItemIntoDropArea(this.currentDragParams.draggedItem, area);
      }

      this.emit(this.constructor.EVENTS.DRAG_STOP, e, this.currentDragParams.draggedItem, area);
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
      // Drag item was dropped on drop area

      this._putDragItemIntoDropArea(dragItem, chosenDropArea);
    } else {
      // Drag item wasn't dropped on drop area

      dragItem.reset();
    }
  }

  _putDragItemIntoDropArea(dragItem, chosenDropArea) {
    // Drag item was dropped on drop area
    let sameDropArea = false;

    if (this.settings.maxItemsInDropArea === 1 && chosenDropArea.innerDragItemsCount) {
      this.replaceDragItems(dragItem, chosenDropArea.innerDragItems[0]);

      return;
    }

    if (this.settings.maxItemsInDropArea && chosenDropArea.innerDragItemsCount === this.settings.maxItemsInDropArea
        || !chosenDropArea.checkAccept(dragItem)) {
      dragItem.reset();

      return;
    }

    if (dragItem.chosenDropArea && dragItem.chosenDropArea !== chosenDropArea) {
      dragItem.chosenDropArea.excludeDragItem(dragItem);
    } else if (dragItem.chosenDropArea) {
      sameDropArea = true;
    }

    if (sameDropArea) {
      dragItem.translateTo(dragItem.coordinates.current, true);
    } else if (this.settings.snap) {
      // DragItem.translateTo(chosenDropArea.coordinates.default, true);
      dragItem.translateTo(chosenDropArea.getAlignedCoords(dragItem), true);
    }
    dragItem.coordinates.current.update();

    chosenDropArea.includeDragItem(dragItem);

    const inRemainingItemsIndex = this.remainingDragItems.indexOf(dragItem);

    if (inRemainingItemsIndex !== -1) {
      // If dropped dragItem isn't on dropArea and remaining drag items array doesn't include it, we add it to remaining drag items array
      this.remainingDragItems.splice(inRemainingItemsIndex, 1);
      this._shiftRemainingDragItems();

      if (!this.settings.possibleToReplaceItem) {
        this._updateSiblings(dragItem);
        dragItem.disable();
      }
    }

    if (this.remainingDragItems[0]) {
      this.remainingDragItems[0].node.focus();
    }

    dragItem.coordinates.droppedIn.update();
  }

  /**
   * Checks, is drop area was intersects by drag item
   * @param {object} dragItem
   * @param {object} dropArea
   * @return {boolean} - return intersection result (true/false)
   * @private
   */
  _checkIntersection(dragItem, dropArea) {
    return localUtils.isIntersectRect(dragItem.coordinates.current.update(), dropArea.coordinates.default.update());
  }

  /**
   * Set new relations of remaining drag items for future keyboard access
   * @param {object} draggedOutItem - drag item, which set to drop area
   */
  _updateSiblings(draggedOutItem) {
    draggedOutItem.siblings.prev.siblings.next = draggedOutItem.siblings.next;
    draggedOutItem.siblings.next.siblings.prev = draggedOutItem.siblings.prev;

    if (this._currentFirstDragItem === draggedOutItem && draggedOutItem.siblings.next !== draggedOutItem) {
      this.currentFirstDragItem = draggedOutItem.siblings.next;
    }

    draggedOutItem.siblings.next = draggedOutItem.siblings.prev = null;
  }

  /**
   * Align remaining free drag items
   * @private
   */
  _shiftRemainingDragItems() {
    // TODO: add changes checking
    if (this.settings.alignRemainingDragItems) {
      this.remainingDragItems.forEach((item, index) => {
        item.translateTo(this.initDragItemsPlaces[index], true);

        item.coordinates.current.update();
        item.coordinates.currentStart.update();
      });
    }
  }

  replaceDragItems(dragItem1, dragItem2) {
    const firstItemDropArea = dragItem1.chosenDropArea;
    const secondItemDropArea = dragItem2.chosenDropArea;

    if (firstItemDropArea) {
      firstItemDropArea.excludeDragItem(dragItem1);
      this._putDragItemIntoDropArea(dragItem2, firstItemDropArea);
    } else {
      dragItem2.reset();
    }

    if (secondItemDropArea) {
      secondItemDropArea.excludeDragItem(dragItem2);
      this._putDragItemIntoDropArea(dragItem1, secondItemDropArea);
    } else {
      dragItem1.reset();
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

    for (const key in this.settings) {
      if (this.settings.hasOwnProperty(key)) {
        this.settings[key] = this._checkSetting(key, this.settings[key]);
      }
    }

    // DragItem.mainDnDEmitter = this;

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
              dndElement = settingName === 'dragItems'
                ? new DragItem(merge({}, { handler: this.settings.handler }, settings), this.emit.bind(this))
                : new DropArea(merge({}, { snapAlignParams: this.settings.snapAlignParams }, settings));
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
      case 'snap':
      case 'disabled':
      case 'alignRemainingDragItems':
      case 'possibleToReplaceItem':
        verifiedValue = localUtils.checkOnBoolean(settingValue);

        if (verifiedValue === null) {
          localUtils.showSettingError(settingName, settingValue, 'Please set true or false.');
        }
        break;
      case 'maxItemsInDropArea':
        verifiedValue = +settingValue;

        if (isNaN(verifiedValue) || verifiedValue < 0) {
          localUtils.showSettingError(settingName, settingValue, 'Please set positive number or 0');
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
   * @param {array} dndElements - array of DragItem/DropArea objects
   * @private
   */
  _setSiblings(dndElements) {
    const dndElementsLength = dndElements.length;

    dndElements[0].siblings.prev = dndElements[dndElementsLength - 1];
    dndElements[dndElementsLength - 1].siblings.next = dndElements[0];

    dndElements.forEach((item, index) => {
      if (!item.siblings.next) {
        item.siblings.next = dndElements[index + 1];
      }
      if (!item.siblings.prev) {
        item.siblings.prev = dndElements[index - 1];
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
