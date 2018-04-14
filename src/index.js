import './common.less';

import EventEmitter from 'events';
import merge from 'merge';
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
        container: document.body,
        alignRemainingDragItems: false,
        possibleToReplaceDroppedItem: false,
        shiftDragItems: false,
        forbidFocusOnFilledDropAreas: false,
        commonDragItemsSettings: {
          handler: '',
          animationParams: {
            animatedProperty: 'transform',
            duration: 500,
            timingFunction: 'ease',
            delay: 0
          },
        },
        commonDropAreasSettings: {
          snap: true,
          maxItemsInDropArea: 1,
          snapAlignParams: {
            withShift: true,
            withDroppedItemCSSMargins: false,
            eachDroppedItemIndents: [0],
            horizontalAlign: 'left',
            verticalAlign: 'top'
          }
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

  static get DND_CLASS() {
    return 'cg-dnd';
  }

  static get CSS_CLASS() {
    return {
      DND: this.DND_CLASS,
      DRAG: `${this.DND_CLASS}-drag-item`,
      HIDDEN_DESC_CONTAINER: `${this.DND_CLASS}-visually-hidden`,
      CURRENT_DRAGGED_ITEM: `${this.DND_CLASS}-current-dragged-item`
    };
  }

  static get CSS_ID() {
    return {
      HIDDEN_DESC_CONTAINER: `${this.DND_CLASS}-aria-descriptions-container-${this.AT_PAGE_DND_COUNTER}`,
      DRAG_ITEMS_KEYBOARD_DESC: `${this.DND_CLASS}-drag-items-keyboard-description-${this.AT_PAGE_DND_COUNTER}`,
      DROP_AREAS_KEYBOARD_DESC: `${this.DND_CLASS}-drop-areas-keyboard-description-${this.AT_PAGE_DND_COUNTER}`
    };
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

  static get AT_PAGE_DND_COUNTER() {
    if (!this._pageDndCounter) {
      this._pageDndCounter = 0;
    }

    return this._pageDndCounter;
  }

  static set AT_PAGE_DND_COUNTER(number) {
    this._pageDndCounter = number;
  }

  /**
   * @param {DndSettings} settings - Dnd's settings, all undefined settings will be taken from {@link CgDnd.DEFAULT_SETTINGS}
   * @constructor
   */
  constructor(settings) {
    super();

    this._applySettings(settings);

    this._initSiblings(this.dragItems);
    this.remainingFirstDragItem = this.dragItems[0];

    if (this.dropAreas) {
      this._initSiblings(this.dropAreas);
      this.firstAllowedDropArea = this.dropAreas[0];
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

    this.dragItems.forEach((item) => {
      item.onMouseDownHandler = this._onMouseDown.bind(this, item);

      item.handler.addEventListener(this.deviceEvents.dragStart, item.onMouseDownHandler, { passive: false });
      item.node.addEventListener('keydown', this._onKeyDown.bind(this, item));
      item.node.addEventListener('click', this._onDragItemClick.bind(this, item));
    });

    if (this.dropAreas) {
      this.dropAreas.forEach((area) => {
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

    if (item.node.style.transition) {
      this.breakTransition(item);
    }

    const box = localUtils.getElementPosition(item.node);
    const pageX = e.pageX || e.touches[0].pageX;
    const pageY = e.pageY || e.touches[0].pageY;

    item.shiftX = pageX - box.left;
    item.shiftY = pageY - box.top;

    const boundsParams = this.settings.bounds instanceof Element
      ? localUtils.getElementPosition(this.settings.bounds)
      : this.settings.bounds;

    this.currentDragParams = {
      draggedItem: item,
      currentBounds: localUtils.calculateCurrentBounds(box, boundsParams, pageX, pageY),
      initPosition: {
        x: pageX,
        y: pageY
      }
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
    const pageX = e.pageX || e.touches[0].pageX;
    const pageY = e.pageY || e.touches[0].pageY;

    if (e.movementX !== undefined && e.movementY !== undefined) {
      this.isClick = !e.movementX && !e.movementY;
    } else {
      this.isClick = pageX === this.currentDragParams.initPosition.x && pageY === this.currentDragParams.initPosition.y;
    }

    if (!this.isClick) {
      const x = localUtils.applyLimit(pageX, this.currentDragParams.currentBounds.left, this.currentDragParams.currentBounds.right);
      const y = localUtils.applyLimit(pageY, this.currentDragParams.currentBounds.top, this.currentDragParams.currentBounds.bottom);

      this.currentDragParams.draggedItem.translateTo({
        left: x - this.currentDragParams.draggedItem.shiftX,
        top: y - this.currentDragParams.draggedItem.shiftY
      });

      this.emit(this.constructor.EVENTS.DRAG_MOVE, e, this.currentDragParams.draggedItem);
    }
  }

  _onMouseUp(e) {
    if (this.isClick) {
      this.currentDragParams.draggedItem.node.click();
    } else {
      this._checkDragItemPosition(this.currentDragParams.draggedItem);
    }
    e.preventDefault();

    document.removeEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler, { passive: false });
    document.removeEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler, { passive: false });
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
      this.currentDragParams = { draggedItem: this.currentDragParams ? this.currentDragParams.draggedItem : item };
      this.currentDragParams.draggedItem.ariaGrabbed = true;

      if (this.dropAreas) {
        this.allowedDropAreas.forEach((area) => {
          area.ariaDropEffect = 'move';
          area.ariaHidden = false;
        });
      }

      this.emit(this.constructor.EVENTS.DRAG_START, e, item);
      this.emit(this.constructor.EVENTS.DRAG_ITEM_SELECT, e, {
        dragItem: item,
        currentDraggedItem: this.currentDragParams.draggedItem,
        dropAreas: this.dropAreas,
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
    if (this.dropAreas) {
      const chosenDropArea = this._getIntersectedElement(this.dropAreas, (area) => this._checkIntersection(dragItem, area));

      if (chosenDropArea) {
        // Drag item was dropped on drop area

        dragItem.putIntoDropArea(chosenDropArea);
      } else {
        // Drag item wasn't dropped on drop area

        dragItem.reset();
        this._finishDrag({
          dragItem,
          remainingDragItems: this.remainingDragItems
        });
      }
    } else {
      const chosenDragItem = this._getIntersectedElement(this.dragItems,
                                                         (item) => dragItem !== item && this._checkIntersection(dragItem, item));

      if (chosenDragItem && !chosenDragItem.disabled) {
        this.settings.shiftDragItems
          ? this.moveDragItems(dragItem, chosenDragItem)
          : this.replaceDragItems(dragItem, chosenDragItem);
      } else {
        dragItem.reset();
        this._finishDrag({ dragItem });
      }
    }
  }

  _onDragItemDroppedOnDropArea(dragItem, dropArea, isSameDropArea) {
    if (isSameDropArea) {
      this._finishDrag({
        dragItem,
        dropArea,
        remainingDragItems: this.remainingDragItems
      });

      return;
    }

    if (this._isNeedToReplace(dropArea)) {
      dropArea.innerDragItems[0].replaceBy(dragItem);

      return;
    }

    if (this._isNeedToReset(dragItem, dropArea)) {
      dragItem.reset();
      this._finishDrag({
        dragItem,
        remainingDragItems: this.remainingDragItems
      });

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
      dropArea.ariaDropEffect = '';
      dropArea.ariaHidden = true;
    }

    if (!this.settings.possibleToReplaceDroppedItem) {
      dragItem.disable();
    }

    this._finishDrag({
      dragItem,
      dropArea,
      remainingDragItems: this.remainingDragItems
    });
  }

  _insertToDropArea(dragItem, dropArea) {
    dropArea.includeDragItem(dragItem);
    dropArea.innerDragItems.length > 1 && this._updateSiblings(dragItem, true, dropArea.innerDragItems);
  }

  _removeFromDropArea(dragItem, dropArea) {
    dropArea.innerDragItems.length > 1 && this._updateSiblings(dragItem, true, dropArea.innerDragItems);
    dropArea.excludeDragItem(dragItem);
    this._resetSiblings(dragItem);
  }

  _removeFromRemainingDragItems(dragItem) {
    this._excludeElementFromArray(this.remainingDragItems, dragItem);
    this._shiftRemainingDragItems();
  }

  _insertToRemainingDragItems(dragItem) {
    this._includeElementToArray(this.remainingDragItems, dragItem);

    if (this.dropAreas) {
      this._shiftRemainingDragItems();
    }
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

  _finishDrag(params = {}) {
    this.emit(this.constructor.EVENTS.DRAG_STOP, null, params);

    if (this.currentDragParams) {
      this.currentDragParams.draggedItem.ariaGrabbed = false;
    }

    if (this.allowedDropAreas) {
      this.allowedDropAreas.forEach((area) => {
        area.ariaDropEffect = '';
        area.ariaHidden = true;
      });
    }

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

    this._resetSiblings(excludedElement);
  }

  _resetSiblings(dragItem) {
    dragItem.siblings.next = dragItem.siblings.prev = null;
  }

  _resetAllSiblings(elementsArray) {
    elementsArray.forEach((item) => this._resetSiblings(item));
  }

  _replaceSiblings(elementsArray) {
    this._resetAllSiblings(elementsArray);
    this._initSiblings(elementsArray, false);
    this.remainingFirstDragItem = elementsArray[0];
  }

  /**
   * Set drag-handlers for each drag item, if Element was got, otherwise set drag-item as drag-handler
   * @param {array} dndElements - array of DragItem/DropArea objects
   * @param {boolean} resetIndex - if  true, we set new indexes since 0, otherwise indexes are not
   * reinstalled (needs for case, when drag items was shuffle)
   * @private
   */
  _initSiblings(dndElements, resetIndex = true) {
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

      if (resetIndex) {
        item.index = index;
      }
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

  shuffleDragItems(dragItem1, dragItem2) {
    if (dragItem1 && dragItem2 && !dragItem2.disabled) {
      this.settings.shiftDragItems
        ? this.moveDragItems(dragItem1, dragItem2)
        : this.replaceDragItems(dragItem1, dragItem2);
    } else {
      dragItem1.reset();
      this._finishDrag({ dragItem1 });
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

    localUtils.replaceArrayItems(this.remainingDragItems, dragItem1, dragItem2);
    this._replaceSiblings(this.remainingDragItems);
    this._finishDrag({
      remainingDragItems: this.remainingDragItems,
      dragItems: this.dragItems,
      dragItem1,
      dragItem2
    });
  }

  /**
   * Replace first drag item after second drag item with a shift intermediate drag items, when drop areas don't exist
   * @param {object} dragItem - first replaced drag item
   * @param {object} toDragItem - drag item, on which place first drag item would be replaced
   */
  moveDragItems(dragItem, toDragItem) {
    localUtils.moveArrayItems(this.remainingDragItems, this.remainingDragItems.indexOf(dragItem),
                              this.remainingDragItems.indexOf(toDragItem));

    this.remainingDragItems.forEach((item) => {
      item.translateTo(this.initDragItemsPlaces[item.index], true, {}, () => item.coordinates.currentStart.update());
    });

    this._replaceSiblings(this.remainingDragItems);

    this._finishDrag({
      remainingDragItems: this.remainingDragItems,
      dragItems: this.dragItems,
      dragItem1: dragItem,
      dragItem2: toDragItem
    });
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
    const elementsSettingNames = ['dragItems', 'dropAreas', 'container'];

    this.settings = merge.recursive(true, {}, this.constructor.DEFAULT_SETTINGS, settings);

    elementsSettingNames.forEach((item) => {
      this[item] = this.settings.hasOwnProperty(item) ? this._checkSetting(item, this.settings[item]) : null;
      delete this.settings[item];
    });
    this._createHiddenDescriptionBlock();

    this.setHiddenAriaContainerFor(this.dragItems);
    this.dropAreas && this.setHiddenAriaContainerFor(this.dropAreas);

    for (const key in this.settings) {
      if (this.settings.hasOwnProperty(key)) {
        this.settings[key] = this._checkSetting(key, this.settings[key]);
      }
    }

    if (Object.keys(this.settings.tooltipParams).length) {
      this.tooltip = new Tooltip(this.settings.tooltipParams);
    }

    this.remainingDragItems = [...this.dragItems];
    this.allowedDropAreas = this.dropAreas ? [...this.dropAreas] : null;
    this.initDragItemsPlaces = [];
    this.dragItems.forEach((item, index) => {
      this.initDragItemsPlaces[index] = merge({}, {}, item.coordinates.default);
    });
  }

  setHiddenAriaContainerFor(dndElem) {
    dndElem.forEach((item) => {
      item.initOwnAriaDescElement(this.hiddenDescContainer);
    });
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
                ? new DragItem(merge.recursive(true, {}, this.settings.commonDragItemsSettings, settings), this.emit.bind(this))
                : new DropArea(merge.recursive(true, {}, this.settings.commonDropAreasSettings, settings));
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
      case 'container':
        verifiedValue = localUtils.getElement(settingValue);

        if (!verifiedValue) {
          localUtils.showSettingError(settingName, settingValue, 'Please set html-node element or html-selector');
        }

        verifiedValue.setAttribute('role', 'application');
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  setSetting(name, value) {
    switch (name) {
      case 'commonDragItemsSettings':
        this._setSettingForEachDnDElement(this.dragItems, value);
        break;
      case 'commonDropAreasSettings':
        this._setSettingForEachDnDElement(this.dropAreas, value);
        break;
      default:
        if (this.settings.hasOwnProperty(name)) {
          this._setOwnSetting(this, name, value);
        } else {
          localUtils.showSettingError(name, value, 'this setting is not supported.');
        }
    }

    const checkedValue = typeof value === 'object' ? merge.recursive(true, {}, this.settings[name], value) : value;

    this.settings[name] = this._checkSetting(name, checkedValue);
  }

  getSetting(name) {
    return this.settings[name];
  }

  _setSettingForEachDnDElement(elementsArray, params) {
    if (typeof params === 'object') {
      elementsArray.forEach((elem) => {
        for (const key in params) {
          if (params.hasOwnProperty(key)) {
            elem.setSetting(key, params[key]);
          }
        }
      });
    } else {
      throw new Error('you should set object of common settings for drag/drop elements');
    }
  }

  _setOwnSetting(obj, name, value) {
    const currentSetting = obj.getSetting(name);

    obj.setSetting(name, typeof currentSetting === 'object' ? merge.recursive(true, {}, currentSetting, value) : value);
  }

  _createHiddenDescriptionBlock() {
    this.constructor.AT_PAGE_DND_COUNTER++;

    this.hiddenDescContainer = localUtils.createHTML({
      html: '',
      container: this.container,
      attrs: {
        'aria-hidden': true,
        class: this.constructor.CSS_CLASS.HIDDEN_DESC_CONTAINER,
        id: this.constructor.CSS_ID.HIDDEN_DESC_CONTAINER
      }
    });
  }

  reset(params = {}) {
    if (this.dropAreas) {
      this.dropAreas.forEach((area) => area.resetInnerDragItems({ removedClassName: params.removedClassName }));
    } else {
      this._resetOnlyDragItemsCase(params);
    }
  }

  resetIncorrectItems() {
    if (this.dropAreas) {
      this.dropAreas.forEach((area) => area.resetIncorrectDragItems());
    }
  }

  /**
   * Reset dragItems, when drop areas do not exist
   * @param {object} params
   */
  _resetOnlyDragItemsCase(params = {}) {
    this.dragItems.forEach((item) => item.reset({
      coordinates: item.coordinates.default,
      removedClassName: params.removedClassName
    }));
    this._resetAllSiblings(this.dragItems);
    this._initSiblings(this.dragItems);
    this.remainingFirstDragItem = this.dragItems[0];
    this.remainingDragItems = [...this.dragItems];
  }

  disableFocusOnCorrectItems() {
    const toRemoveFromRemainingItems = [];

    this.remainingDragItems.forEach((item) => item.correct && toRemoveFromRemainingItems.push(item));

    if (toRemoveFromRemainingItems.length) {
      toRemoveFromRemainingItems.forEach((item) => this._excludeElementFromArray(this.remainingDragItems, item));
      this.remainingFirstDragItem = this.remainingDragItems.length ? this.remainingDragItems[0] : null;
    } else {
      this.remainingFirstDragItem = null;
    }
  }

  breakTransition(item) {
    const event = new Event('transitionend');

    item.node.dispatchEvent(event);
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
