import './common.less';

import EventEmitter from 'events';
import merge from 'merge';
// Import cgUtils from 'cg-component-utils';
import localUtils from 'utils';
import DragItem from 'DragItem';
import DropArea from 'DropArea';
import Tooltip from 'Tooltip';

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
        possibleToReplaceDroppedItem: false,
        shiftDragItems: false,
        forbidFocusOnFilledDropAreas: false,
        animationParams: {
          animatedProperty: 'transform',
          duration: 500,
          timingFunction: 'ease',
          delay: 0
        },
        snapAlignParams: {
          withShift: true,
          withDroppedItemCSSMargins: false,
          eachDroppedItemIndents: [0],
          horizontalAlign: 'left',
          verticalAlign: 'top'
        },
        tooltipParams: {},
        onCreate: () => {},
        onDragStart: () => {},
        onDragMove: () => {},
        onDragStop: () => {},
        onDragItemSelect: () => {},
        onDropAreaSelect: () => {}
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
        KEY_DOWN: 'keydown',
        DRAG_ITEM_SELECT: 'dragItemSelect',
        DROP_AREA_SELECT: 'dropAreaSelect'
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
        onDragStop: this.EVENTS.DRAG_STOP,
        onDragItemSelect: this.EVENTS.DRAG_ITEM_SELECT,
        onDropAreaSelect: this.EVENTS.DROP_AREA_SELECT
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

    this._initSiblings(this.settings.dragItems);
    this.remainingFirstDragItem = this.settings.dragItems[0];

    if (this.settings.dropAreas) {
      this._initSiblings(this.settings.dropAreas);
      this.firstAllowedDropArea = this.settings.dropAreas[0];
      this.firstAllowedDropArea.tabIndex = this.settings.possibleToReplaceDroppedItem ? 0 : -1;
    }

    // This._render();

    this._addListeners();

    this.emit(this.constructor.EVENTS.CREATE, this);
  }

  set remainingFirstDragItem(dragItem) {
    if (this._remainingFirstDragItem) {
      this._remainingFirstDragItem.tabIndex = -1;
    }

    if (dragItem) {
      this._remainingFirstDragItem = dragItem;
      this._remainingFirstDragItem.tabIndex = 0;
    } else {
      this._remainingFirstDragItem = null;
    }
  }

  get remainingFirstDragItem() {
    return this._remainingFirstDragItem;
  }

  set firstAllowedDropArea(dropArea) {
    this._firstAllowedDropArea = dropArea;
  }

  get firstAllowedDropArea() {
    return this._firstAllowedDropArea;
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

    if (this.settings.dropAreas) {
      this.settings.dropAreas.forEach((area) => {
        area.node.addEventListener('keydown', this._onKeyDown.bind(this, area));
        area.node.addEventListener('click', this._onDropAreaClick.bind(this, area));
      });
    }

    this.on(DragItem.EVENTS.DRAG_ITEM_RESET, this._onDragItemReset);
    this.on(DragItem.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this._onDragItemDroppedOnDropArea);
  }

  _onMouseDown(item, e) {
    e.preventDefault();

    this.isClick = true;

    const box = localUtils.getElementPosition(item.node);

    item.shiftX = e.pageX - box.left;
    item.shiftY = e.pageY - box.top;

    const boundsParams = this.settings.bounds instanceof Element
      ? localUtils.getElementPosition(this.settings.bounds)
      : this.settings.bounds;

    this.currentDragParams = {
      draggedItem: item,
      currentBounds: localUtils.calculateCurrentBounds(box, boundsParams, e.pageX, e.pageY)
    };

    this.onMouseMoveHandler = this._onMouseMove.bind(this);
    this.onMouseUpHandler = this._onMouseUp.bind(this);

    document.addEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler, { passive: false });
    document.addEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler, { passive: false });

    this.emit(this.constructor.EVENTS.DRAG_START, e, item);

    // This.tooltip.show(item);
  }

  _onMouseMove(e) {
    e.preventDefault();

    this.isClick = false;

    const x = localUtils.applyLimit(e.pageX, this.currentDragParams.currentBounds.left, this.currentDragParams.currentBounds.right);
    const y = localUtils.applyLimit(e.pageY, this.currentDragParams.currentBounds.top, this.currentDragParams.currentBounds.bottom);

    this.currentDragParams.draggedItem.translateTo({
      left: x - this.currentDragParams.draggedItem.shiftX,
      top: y - this.currentDragParams.draggedItem.shiftY
    });

    this.emit(this.constructor.EVENTS.DRAG_MOVE, e, this.currentDragParams.draggedItem);
  }

  _onMouseUp(e) {
    e.preventDefault();

    document.removeEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler, { passive: false });
    document.removeEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler, { passive: false });

    this._checkDragItemPosition(this.currentDragParams.draggedItem);
  }

  _onDragItemReset(dragItem, chosenDropArea) {
    if (this.remainingDragItems.indexOf(dragItem) === -1) {
      // If dropped dragItem is on dropArea and remaining drag items array includes it, we remove it from remaining drag items array
      if (chosenDropArea) {
        this._removeFromDropArea(dragItem, chosenDropArea);
      }

      this._insertToRemainingDragItems(dragItem);
    }

    if (chosenDropArea && this.allowedDropAreas.indexOf(chosenDropArea) === -1) {
      this._includeElementToArray(this.allowedDropAreas, chosenDropArea);
    }
  }

  _onKeyDown(item, e) {
    // E.preventDefault();

    const KEY_CODES = this.constructor.KEY_CODES;

    switch (e.keyCode) {
      case KEY_CODES.UP_ARROW:
        e.preventDefault();
        if (item.siblings.prev) {
          item.siblings.prev.focus();
        }
        break;
      case KEY_CODES.DOWN_ARROW:
        e.preventDefault();
        if (item.siblings.next) {
          item.siblings.next.focus();
        }
        break;
      case KEY_CODES.ENTER:
      case KEY_CODES.SPACE:
        e.preventDefault();
        this.isClick = true;
        item.node.click();
        break;
      default:
    }
  }

  _onDragItemClick(item, e) {
    if (this.isClick) {
      this.currentDragParams = { draggedItem: item };

      this.emit(this.constructor.EVENTS.DRAG_START, e, item);
      this.emit(this.constructor.EVENTS.DRAG_ITEM_SELECT, e, {
        dragItem: item,
        dropAreas: this.settings.dropAreas,
        allowedDropAreas: this.allowedDropAreas,
        firstAllowedDropArea: this.firstAllowedDropArea
      });
    }
  }

  _onDropAreaClick(area, e) {
    if (this.isClick) {
      this.emit(this.constructor.EVENTS.DROP_AREA_SELECT, e, {
        dropArea: area,
        droppedItems: area.innerDragItems,
        currentDraggedItem: this.currentDragParams ? this.currentDragParams.draggedItem : null,
        remainingDragItems: this.remainingDragItems
      });
    }
  }

  /**
   * Checks, is drop area was intersects by drag item. If it's true and settings.snap is true,
   * then align drag item by drop area, else move drag item to default position
   * @param {object} dragItem
   * @private
   */
  _checkDragItemPosition(dragItem) {
    if (this.settings.dropAreas) {
      const chosenDropArea = this._getIntersectedElement(this.settings.dropAreas, (area) => this._checkIntersection(dragItem, area));

      if (chosenDropArea) {
        // Drag item was dropped on drop area

        dragItem.putIntoDropArea(chosenDropArea);
      } else {
        // Drag item wasn't dropped on drop area

        dragItem.reset();
        this._finishDrag(dragItem);
      }
    } else {
      const chosenDragItem = this._getIntersectedElement(this.settings.dragItems,
                                                         (item) => dragItem !== item && this._checkIntersection(dragItem, item));

      if (chosenDragItem) {
        this.settings.shiftDragItems
          ? this.moveDragItems(dragItem, chosenDragItem)
          : this.replaceDragItems(dragItem, chosenDragItem);
      } else {
        dragItem.reset();
        this._finishDrag(dragItem);
      }
    }
  }

  _onDragItemDroppedOnDropArea(dragItem, dropArea, isSameDropArea) {
    if (isSameDropArea) {
      this._finishDrag(dragItem, dropArea);

      return;
    }

    if (this._isNeedToReplace(dropArea)) {
      dropArea.innerDragItems[0].replaceBy(dragItem);

      return;
    }

    if (this._isNeedToReset(dragItem, dropArea)) {
      dragItem.reset();
      this._finishDrag(dragItem);

      return;
    }

    const previousDropArea = dragItem.chosenDropArea;

    if (previousDropArea) {
      this._removeFromDropArea(dragItem, previousDropArea);
    } else {
      this._removeFromRemainingDragItems(dragItem);
    }

    this._insertToDropArea(dragItem, dropArea);

    if (this._isForbiddenDropArea(dropArea)) {
      this._excludeElementFromArray(this.allowedDropAreas, dropArea);
    }

    if (!this.settings.possibleToReplaceDroppedItem) {
      dragItem.disable();
    }

    this._finishDrag(dragItem, dropArea);
  }

  _insertToDropArea(dragItem, dropArea) {
    dropArea.includeDragItem(dragItem);
    dropArea.innerDragItems.length > 1 && this._updateSiblings(dragItem, true, dropArea.innerDragItems);
  }

  _removeFromDropArea(dragItem, dropArea) {
    dropArea.innerDragItems.length > 1 && this._updateSiblings(dragItem, true, dropArea.innerDragItems);
    dropArea.excludeDragItem(dragItem);
    this._removeSiblings(dragItem);
  }

  _removeFromRemainingDragItems(dragItem) {
    this._excludeElementFromArray(this.remainingDragItems, dragItem);
    this._shiftRemainingDragItems();
  }

  _insertToRemainingDragItems(dragItem) {
    this._includeElementToArray(this.remainingDragItems, dragItem);
    this._shiftRemainingDragItems();
  }

  _isNeedToReplace(dropArea) {
    return dropArea.maxItemsInDropArea === 1 && dropArea.innerDragItemsCount && this.settings.possibleToReplaceDroppedItem;
  }

  _isNeedToReset(dragItem, dropArea) {
    return dropArea.maxItemsInDropArea && dropArea.innerDragItemsCount === dropArea.maxItemsInDropArea || !dropArea.checkAccept(dragItem);
  }

  _isForbiddenDropArea(dropArea) {
    return this.settings.forbidFocusOnFilledDropAreas && dropArea.maxItemsInDropArea === dropArea.innerDragItemsCount;
  }

  _finishDrag(dragItem, dropArea) {
    this.emit(this.constructor.EVENTS.DRAG_STOP, null, dragItem, dropArea);
    this.currentDragParams = null;
  }

  _getIntersectedElement(checkedElements, checkCB) {
    const intersectedItemIndex = localUtils.findIndex(checkedElements, checkCB);

    return intersectedItemIndex > -1 ? checkedElements[intersectedItemIndex] : null;
  }

  _includeElementToArray(array, element) {
    array.push(element);

    if (array.length > 1) {
      array.sort((elem1, elem2) => elem1.index - elem2.index);
    }

    this._updateSiblings(element);
  }

  _excludeElementFromArray(array, element) {
    const inArrayElementIndex = array.indexOf(element);

    if (inArrayElementIndex !== -1) {
      array.splice(inArrayElementIndex, 1);
      this._updateSiblings(element);
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
    const comparedAreaCoords = dropArea instanceof DropArea ? dropArea.coordinates.default.update() : dropArea.coordinates.currentStart;

    return localUtils.isIntersectRect(dragItem.coordinates.current.update(), comparedAreaCoords);
  }

  _updateSiblings(element, withoutCB = false, array) {
    if (withoutCB) {
      this._updateElementSiblings(element, array);
    } else if (element instanceof DragItem) {
      this._updateElementSiblings(element, this.remainingDragItems, this.remainingFirstDragItem, (item) => {
        this.remainingFirstDragItem = item;
      });
    } else {
      this._updateElementSiblings(element, this.allowedDropAreas, this.firstAllowedDropArea, (area) => {
        this.firstAllowedDropArea = area;
      });
    }
  }

  /**
   * Set new relations of remaining drag items for future keyboard access
   * @param {object} element - drag item, which set to drop area
   * @param {array} elementsArray - array with siblings elements
   * @param {object} firstCurrentElement - first remaining drag item or first allowed drp area
   * @param {function} setFirstCurrentElementCB - callback-function for setting first element
   */
  _updateElementSiblings(element, elementsArray, firstCurrentElement, setFirstCurrentElementCB) {
    if (!element.siblings.next && !element.siblings.prev) {

      /**
       * If drag item was returned to remaining drag items from drop area
       */

      const returnedItemIndex = localUtils.findIndex(elementsArray, (remainingItem) => remainingItem === element);
      const closestElements = this._getClosestArraySiblings(elementsArray, returnedItemIndex);

      this._includeToSiblings(element, closestElements, elementsArray, firstCurrentElement, setFirstCurrentElementCB);
    } else {
      /**
       * If drag item was leaved from remaining drag items to drop area
       */

      this._excludeFromSiblings(element, firstCurrentElement, setFirstCurrentElementCB);
    }
  }

  _getClosestArraySiblings(elementsArray, elementIndex) {
    const arrayBegin = 0;
    const arrayEnd = elementsArray.length - 1;
    const prevIndex = elementIndex === arrayBegin ? arrayEnd : elementIndex - 1;
    const nextIndex = elementIndex === arrayEnd ? arrayBegin : elementIndex + 1;

    return {
      prevElement: elementsArray[prevIndex],
      nextElement: elementsArray[nextIndex]
    };
  }

  _includeToSiblings(element, inArraySiblings, elementsArray, firstCurrentElement, setFirstCurrentElementCB) {
    const { prevElement, nextElement } = inArraySiblings;

    prevElement.siblings.next = element;
    element.siblings.prev = prevElement;

    nextElement.siblings.prev = element;
    element.siblings.next = nextElement;

    if (firstCurrentElement && firstCurrentElement !== elementsArray[0]) {
      setFirstCurrentElementCB(elementsArray[0]);
    }
  }

  _excludeFromSiblings(excludedElement, currentFirstElement, setFirstCurrentElementCB) {
    excludedElement.siblings.prev.siblings.next = excludedElement.siblings.next;
    excludedElement.siblings.next.siblings.prev = excludedElement.siblings.prev;

    if (currentFirstElement === excludedElement && excludedElement.siblings.next !== excludedElement) {
      setFirstCurrentElementCB(excludedElement.siblings.next);
    }

    this._removeSiblings(excludedElement);
  }

  _removeSiblings(dragItem) {
    dragItem.siblings.next = dragItem.siblings.prev = null;
  }

  /**
   * Set drag-handlers for each drag item, if Element was got, otherwise set drag-item as drag-handler
   * @param {array} dndElements - array of DragItem/DropArea objects
   * @private
   */
  _initSiblings(dndElements) {
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
   * Align remaining free drag items
   * @private
   */
  _shiftRemainingDragItems() {
    // TODO: add changes checking
    if (this.settings.alignRemainingDragItems) {
      this.remainingDragItems.forEach((item, index) => {
        item.translateTo(this.initDragItemsPlaces[index], true, {}, () => item.coordinates.currentStart.update());
      });
    }
  }

  /**
   * Replace drag items between themselves, when drop areas don't exist
   * @param {object} dragItem1 - first replaced drag item
   * @param {object} dragItem2 - second replaced drag item
   */
  replaceDragItems(dragItem1, dragItem2) {
    const firstItemStartCoordinates = merge.recursive(true, {}, dragItem1.coordinates.currentStart);
    const secondItemStartCoordinates = merge.recursive(true, {}, dragItem2.coordinates.currentStart);

    dragItem1.translateTo(secondItemStartCoordinates, true, {}, () => dragItem1.coordinates.currentStart.update());
    dragItem2.translateTo(firstItemStartCoordinates, true, {}, () => dragItem2.coordinates.currentStart.update());

    localUtils.replaceArrayItems(this.settings.dragItems, dragItem1, dragItem2);
    this._finishDrag(this.settings.dragItems, dragItem1, dragItem2);
  }

  /**
   * Replace first drag item after second drag item with a shift intermediate drag items, when drop areas don't exist
   * @param {object} dragItem - first replaced drag item
   * @param {object} toDragItem - drag item, on which place first drag item would be replaced
   */
  moveDragItems(dragItem, toDragItem) {
    localUtils.moveArrayItems(this.settings.dragItems, dragItem.index, toDragItem.index);

    this.settings.dragItems.forEach((item, index) => {
      item.translateTo(this.initDragItemsPlaces[index], true, {}, () => item.coordinates.currentStart.update());
    });
    this._finishDrag(this.settings.dragItems, dragItem, toDragItem);
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
    this.settings = merge.recursive(true, {}, this.constructor.DEFAULT_SETTINGS, settings);

    for (const key in this.settings) {
      if (this.settings.hasOwnProperty(key)) {
        this.settings[key] = this._checkSetting(key, this.settings[key]);
      }
    }

    if (Object.keys(this.settings.tooltipParams).length) {
      this.tooltip = new Tooltip(this.settings.tooltipParams);
    }


    // DragItem.mainDnDEmitter = this;

    this.remainingDragItems = [...this.settings.dragItems];
    this.allowedDropAreas = this.settings.dropAreas ? [...this.settings.dropAreas] : null;
    this.initDragItemsPlaces = [];
    setTimeout(() => {
      this.settings.dragItems.forEach((item, index) => {
        this.initDragItemsPlaces[index] = merge({}, {}, item.coordinates.default);
      });
    }, 0);
  }

  /**
   * Checks and fix user settings
   * @param {string} settingName - checked property.
   * @param {string|number|object|boolean} settingValue - checked property value
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
                : new DropArea(merge.recursive(
                true, {
                  snapAlignParams: this.settings.snapAlignParams,
                  maxItemsInDropArea: this.settings.maxItemsInDropArea
                },
                settings));
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
          verifiedValue = localUtils.getElement(settingValue) || document.documentElement;
        }
        break;
      case 'helper':
        verifiedValue = settingValue.toLowerCase() === 'clone' ? 'clone' : this.constructor.DEFAULT_SETTINGS.helper;
        break;
      case 'snap':
      case 'disabled':
      case 'alignRemainingDragItems':
      case 'possibleToReplaceDroppedItem':
      case 'forbidFocusOnFilledDropAreas':
        verifiedValue = localUtils.checkOnBoolean(settingValue);

        if (verifiedValue === null) {
          localUtils.showSettingError(settingName, settingValue, 'Please set true or false.');
        }
        break;
      case 'onCreate':
      case 'onDragStart':
      case 'onDragMove':
      case 'onDragStop':
      case 'onDragItemSelect':
      case 'onDropAreaSelect':
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

  reset() {
    this.settings.dropAreas.forEach((area) => area.resetInnerDragItems());
  }

  resetIncorrectItems() {
    this.settings.dropAreas.forEach((area) => area.resetIncorrectDragItems());
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
