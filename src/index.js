import './common.less';

import EventEmitter from 'events';
import merge from 'merge';
import utils from 'utils';
import DragItem from 'DragItem';
import DropArea from 'DropArea';
import Tooltip from 'Tooltip';

/**
 * DnD's customizing settings
 * @typedef {Object} DndSettings
 * @property {boolean} disabled - disables all DnD's elements.
 * @property {string} disabledClassName - the css class name, which will be assigned to disabled elements.
 * @property {(string|number[])} bounds - the limits for dragged elements. It accepts css-selector or number's array like [x0, y0, x1, y1].
 * @property {string} helper - announces, what element's part will be dragged (original or clone). Accepts 'original' or 'clone'.
 * @property {(string|Element)} container - css-selector or Element, which contains dragItems and dropAreas.
 * @property {boolean} alignRemainingDragItems - if 'true', remaining drag items will be aligned after dragging one of them.
 * @property {boolean} possibleToReplaceDroppedItem - if 'true', user can change dropped items position.
 * @property {boolean} shiftDragItems - flag for only drag items case (without existing drop areas). If 'true', replaced drag item will
 *                                      shift remaining drag items after or before it.
 * @property {boolean} forbidFocusOnFilledDropAreas - if 'true', fully filled drop areas will not be focused.

 * @property {object} commonDragItemsSettings - initial settings for all drag items.
   * @property {(string|Element)} commonDragItemsSettings.handler - html-element for start dragging by mouse/touch.
   * @property {object} commonDragItemsSettings.animationParams - settings for CSS-transition property.
     * @property {string} commonDragItemsSettings.animationParams.animatedProperty - animated CSS-property name.
     * @property {number} commonDragItemsSettings.animationParams.duration - animation's duration in ms.
     * @property {string} commonDragItemsSettings.animationParams.timingFunction - animation's timing function name.
     * @property {number} commonDragItemsSettings.animationParams.delay
 *
 * @property {object} commonDropAreasSettings - initial settings for all drop areas.
   * @property {number} commonDropAreasSettings.maxItemsInDropArea - if '0', drop area accepts unlimited dropped items count.
   * @property {boolean} commonDropAreasSettings.snap - if 'true', dropped item will be aligned by drop area boundaries
   *                                                    or special snap settings (snapAlignParams).
   * @property {object} commonDropAreasSettings.snapAlignParams - aligning params for items, which were dropped in own drop area
     * @property {boolean} commonDropAreasSettings.snapAlignParams.withShift - if 'true' dropped items will be aligned
     *                                                                         after dragging in/out one of them.
     * @property {boolean} commonDropAreasSettings.snapAlignParams.withDroppedItemCSSMargins - dropped item's position will be calculated
     *                                                                                         with considering of their css-margins
     * @property {number[]} commonDropAreasSettings.snapAlignParams.eachDroppedItemIndents - custom indents for each dropped item like
     *                                                                                       css-margins property: [all] | [top, bottom] |
     *                                                                                       [top, left&right, bottom] |
     *                                                                                       [top, right, bottom, left]
     * @property {string} commonDropAreasSettings.snapAlignParams.horizontalAlign - aligns dropped item by horizontal.
     *                                                                              Accepts [left|center|right].
     * @property {string} commonDropAreasSettings.snapAlignParams.verticalAlign - aligns dropped item by vertical.
     *                                                                              Accepts [top|center|bottom].

 * @property {function(number):*} onCreate - on DnDObject creating callback
 * @property {function(number):*} onDragStart - on drag start event callback
 * @property {function(number):*} onDragMove - on drag start event callback
 * @property {function(number):*} onDragStop - on drag start event callback
 * @property {function(number):*} onDragItemSelect - on drag item, selected by space/enter buttons or by double touch
 *                                                   with enabled screenreader, event callback
 * @property {function(number):*} onDropAreaSelect - on drop area, selected by space/enter buttons or by double touch
 *                                                   with enabled screenreader, event callback
 */

/**
 * @typedef {object} dragItem
 * @typedef {object} dropArea
 */

/**
 * Accessible DnD Component
 */
class CgDnd extends EventEmitter {

  /**
   * DnD's customizing settings
   * @type {DndSettings}
   * @static
   */
  static get DEFAULT_SETTINGS() {
    if (!this._DEFAULT_SETTINGS) {
      this._DEFAULT_SETTINGS = {
        disabled: false,
        disabledClassName: '',
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
          maxItemsInDropArea: 1,
          snap: true,
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

  /**
   * Unique CSS IDs for multiple dnd-objects on the page
   * @type {object}
   * @static
   */
  static get CSS_ID() {
    return {
      HIDDEN_DESC_CONTAINER: `${this.DND_CLASS}-aria-descriptions-container-${this.AT_PAGE_DND_COUNTER}`,
      DRAG_ITEMS_KEYBOARD_DESC: `${this.DND_CLASS}-drag-items-keyboard-description-${this.AT_PAGE_DND_COUNTER}`,
      DROP_AREAS_KEYBOARD_DESC: `${this.DND_CLASS}-drop-areas-keyboard-description-${this.AT_PAGE_DND_COUNTER}`
    };
  }

  static get EVENTS() {
    if (!this._EVENTS) {
      this._EVENTS = {
        CREATE: 'create',
        DRAG_START: 'drag_start',
        DRAG_MOVE: 'drag_move',
        DRAG_STOP: 'drag_stop',
        DRAG_ITEM_SELECT: 'dragItemSelect',
        DROP_AREA_SELECT: 'dropAreaSelect'
      };
    }

    return this._EVENTS;
  }

  static get STANDARD_EVENTS() {
    if (!this._STANDARD_EVENTS) {
      this._STANDARD_EVENTS = {
        KEYDOWN: 'keydown',
        CLICK: 'click'
      };
    }

    return this._STANDARD_EVENTS;
  }

  static get KEY_CODES() {
    if (!this._KEY_CODES) {
      this._KEY_CODES = {
        ENTER: 13,
        SPACE: 32,
        LEFT_ARROW: 37,
        UP_ARROW: 38,
        RIGHT_ARROW: 39,
        DOWN_ARROW: 40
      };
    }

    return this._KEY_CODES;
  }

  /**
   * @return {Object} - callbacks with appropriate events relations
   */
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
    }

    if (this.settings.disabled) {
      this.disable();
    }

    this._addListeners();

    this.emit(this.constructor.EVENTS.CREATE, this);
  }

  /**
   * Sets remaining first drag item
   * @param {dragItem} dragItem
   */
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

  /**
   * @return {dragItem} first remaining dragItem
   */
  get remainingFirstDragItem() {
    return this._remainingFirstDragItem;
  }

  /**
   * Sets first allowed drop area
   * @param {dropArea} dropArea
   */
  set firstAllowedDropArea(dropArea) {
    this._firstAllowedDropArea = dropArea;
  }

  /**
   * @return {dropArea} first allowed drop area
   */
  get firstAllowedDropArea() {
    return this._firstAllowedDropArea;
  }

  /**
   * Add event listeners
   * @private
   */
  _addListeners() {
    this.deviceEvents = utils.getDeviceEvents();

    this.dragItems.forEach((item) => {
      item.onMouseDownHandler = this._onMouseDown.bind(this, item);
      item.onKeyDownHandler = this._onKeyDown.bind(this, item);
      item.onClickHandler = this._onDragItemClick.bind(this, item);

      item.handler.addEventListener(this.deviceEvents.dragStart, item.onMouseDownHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, item.onKeyDownHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.CLICK, item.onClickHandler);
    });

    if (this.dropAreas) {
      this.dropAreas.forEach((area) => {
        area.onKeyDownHandler = this._onKeyDown.bind(this, area);
        area.onClickHandler = this._onDropAreaClick.bind(this, area);

        area.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, area.onKeyDownHandler);
        area.node.addEventListener(this.constructor.STANDARD_EVENTS.CLICK, area.onClickHandler);
      });
    }

    this.on(DragItem.EVENTS.DRAG_ITEM_RESET, this._onDragItemReset);
    this.on(DragItem.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this._onDragItemDroppedOnDropArea);
  }

  _onMouseDown(item, e) {
    if (!item.disabled) {
      e.preventDefault();

      this.isClick = true;

      if (item.node.style.transition) {
        this.breakTransition(item);
      }

      const box = utils.getElementPosition(item.node);
      const pageX = e.pageX || e.touches[0].pageX;
      const pageY = e.pageY || e.touches[0].pageY;

      item.shiftX = pageX - box.left;
      item.shiftY = pageY - box.top;

      const boundsParams = this.settings.bounds instanceof Element
        ? utils.getElementPosition(this.settings.bounds)
        : this.settings.bounds;

      this.currentDragParams = {
        draggedItem: item,
        currentBounds: utils.calculateCurrentBounds(box, boundsParams, pageX, pageY),
        initPosition: {
          x: pageX,
          y: pageY
        }
      };

      this.onMouseMoveHandler = this._onMouseMove.bind(this);
      this.onMouseUpHandler = this._onMouseUp.bind(this);

      document.addEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler);
      document.addEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler);

      this.emit(this.constructor.EVENTS.DRAG_START, e, item);
    }
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
      const x = utils.applyLimit(pageX, this.currentDragParams.currentBounds.left, this.currentDragParams.currentBounds.right);
      const y = utils.applyLimit(pageY, this.currentDragParams.currentBounds.top, this.currentDragParams.currentBounds.bottom);

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

    document.removeEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler);
    document.removeEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler);
  }

  _onDragItemReset(dragItem, chosenDropArea) {
    if (this.remainingDragItems.indexOf(dragItem) === -1) {
      /**
       * If dropArea includes reseted drag item, we exclude it from dropArea
       */
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
    if (!item.disabled) {
      const KEY_CODES = this.constructor.KEY_CODES;

      switch (e.keyCode) {
        case KEY_CODES.UP_ARROW:
        case KEY_CODES.LEFT_ARROW:
          e.preventDefault();
          if (item.siblings.prev) {
            item.siblings.prev.focus();
          }
          break;
        case KEY_CODES.DOWN_ARROW:
        case KEY_CODES.RIGHT_ARROW:
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
  }

  /**
   * Handler on drag item, which is selected by space/enter or touch event with enabled screenreader
   * @param {dragItem} item
   * @param {object} e
   * @private
   */
  _onDragItemClick(item, e) {
    if (this.isClick && !item.disabled) {
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

  /**
   * Handler on drop area, which is selected by space/enter or touch event with enabled screenreader
   * @param {dropArea} area
   * @param {object} e
   * @private
   */
  _onDropAreaClick(area, e) {
    if (this.isClick && !area.disabled) {
      this.emit(this.constructor.EVENTS.DROP_AREA_SELECT, e, {
        dropArea: area,
        droppedItems: area.innerDragItems,
        currentDraggedItem: this.currentDragParams ? this.currentDragParams.draggedItem : null,
        remainingDragItems: this.remainingDragItems
      });
    }
  }

  /**
   * Checks, is drop area intersected by drag item. If it's true and settings.snap is true,
   * then aligns drag item by drop area boundaries, else move drag item to default position.
   * For case, when only drag items are exist, checks intersection with other drag item
   * @param {dragItem} dragItem
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

      this.shuffleDragItems(dragItem, chosenDragItem);
    }
  }

  /**
   * Checks main setting's conditions before putting drag item into drop area
   * @param {dragItem} dragItem
   * @param {dropArea} dropArea
   * @param {boolean} isSameDropArea - if true, drag item returns back to chosen drop area's position
   * @private
   */
  _onDragItemDroppedOnDropArea(dragItem, dropArea, isSameDropArea) {
    const forUserArgs = {
      dragItem,
      dropArea,
      remainingDragItems: this.remainingDragItems
    };

    if (isSameDropArea) {
      this._finishDrag(forUserArgs);

      return;
    }

    if (this._isNeedToReplace(dropArea)) {
      dropArea.innerDragItems[0].replaceBy(dragItem);

      return;
    }

    if (this._isNeedToReset(dragItem, dropArea)) {
      dragItem.reset();
      this._finishDrag(forUserArgs);

      return;
    }

    const previousDropArea = dragItem.chosenDropArea;

    if (previousDropArea) {
      this._removeFromDropArea(dragItem, previousDropArea);
    } else {
      this._removeFromRemainingDragItems(dragItem);
    }

    this._insertToDropArea(dragItem, dropArea);

    if (this._isDropAreaBecomesForbidden(dropArea)) {
      this._excludeElementFromArray(this.allowedDropAreas, dropArea);
      dropArea.ariaDropEffect = '';
      dropArea.ariaHidden = true;
    }

    if (!this.settings.possibleToReplaceDroppedItem) {
      dragItem.disable();
    }

    this._finishDrag(forUserArgs);
  }

  /**
   * Add dragItem to DropArea's innerDragItems property with updating dragItem's siblings elements for keyboard access
   * @param {dragItem} dragItem
   * @param {dropArea} dropArea
   * @private
   */
  _insertToDropArea(dragItem, dropArea) {
    dropArea.includeDragItem(dragItem);
    dropArea.innerDragItems.length > 1 && this._updateSiblings(dragItem, true, dropArea.innerDragItems);

    if (this._isSomethingToReplaceInDropAreas()) {
      this.firstAllowedDropArea.tabIndex = 0;
    }
  }

  /**
   * Remove dragItem from DropArea's innerDragItems property with updating dragItem's siblings elements for keyboard access
   * @param {dragItem} dragItem
   * @param {dropArea} dropArea
   * @private
   */
  _removeFromDropArea(dragItem, dropArea) {
    dropArea.innerDragItems.length > 1 && this._updateSiblings(dragItem, true, dropArea.innerDragItems);
    dropArea.excludeDragItem(dragItem);
    this._resetSiblings(dragItem);
  }

  /**
   * Remove dragItem from remaining drag items array with shifting other remaining drag items, if it will be needed
   * @param {dragItem} dragItem
   * @private
   */
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

  /**
   * Checks, is dropArea's inner dragItem needed for replacing
   * @param {dropArea} dropArea
   * @return {boolean} - flag
   * @private
   */
  _isNeedToReplace(dropArea) {
    return dropArea.maxItemsInDropArea === 1 && dropArea.innerDragItemsCount && this.settings.possibleToReplaceDroppedItem;
  }

  /**
   * Checks dragged item accepting in dropArea
   * @param {dragItem} dragItem
   * @param {dropArea} dropArea
   * @return {boolean} - flag
   * @private
   */
  _isNeedToReset(dragItem, dropArea) {
    return dropArea.maxItemsInDropArea && dropArea.innerDragItemsCount === dropArea.maxItemsInDropArea || !dropArea.checkAccept(dragItem);
  }

  /**
   * Checks, is dropArea disabled for future focus access
   * @param {dropArea} dropArea
   * @return {boolean} - flag
   * @private
   */
  _isDropAreaBecomesForbidden(dropArea) {
    return this.settings.forbidFocusOnFilledDropAreas && dropArea.maxItemsInDropArea === dropArea.innerDragItemsCount;
  }

  /**
   * Checks, has drop area inner drag item, which is available for replacing. If true,
   * first drop area will have tabindex="0", for drag item replacing possibility
   * @return {boolean} - flag
   * @private
   */
  _isSomethingToReplaceInDropAreas() {
    return this.settings.possibleToReplaceDroppedItem && this.firstAllowedDropArea.tabIndex === -1 && this._dropAreasHaveDragItems();
  }

  /**
   * Checks, hasn't each drop area inner drag item, which is available for replacing. If true,
   * first drop area will have tabindex="-1"
   * @return {boolean} - flag
   * @private
   */
  _isNothingToReplaceInDropAreas() {
    return this.settings.possibleToReplaceDroppedItem && this.firstAllowedDropArea.tabIndex === 0 && !this._dropAreasHaveDragItems();
  }

  /**
   * Checks, are one of drop areas exist with inner drag items
   * @return {boolean} - flag
   * @private
   */
  _dropAreasHaveDragItems() {
    return utils.findIndex(this.allowedDropAreas, (area) => area.innerDragItemsCount > 0) !== -1;
  }

  /**
   * Setup needed aria-attributes after stop dragging and emit DRAG_STOP event with needed parameters
   * @param {object} params - parameter's object, which will be sent to user onDragStop-callback
   * @private
   */
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

      if (this._isNothingToReplaceInDropAreas()) {
        this.firstAllowedDropArea.tabIndex = -1;
      }
    }

    this.currentDragParams = null;
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
   * @callback checkCallBack
   * @param {dragItem|dropArea} element - one of checked elements
   * @return {number} - intersected element index or '-1', if it wasn't found
   */

  /**
   * Return intersected element or null, if it wasn't found
   * @param {dropAreas[]|dragItems[]} checkedElements - elements for comparing
   * @param {checkCallBack} checkCB - callback for comparing each element with dragged item,
   *                                                       which return intersected element index
   * @return {dropArea|dragItem|null} - return intersected element or null, if it wasn't found
   * @private
   */
  _getIntersectedElement(checkedElements, checkCB) {
    const intersectedItemIndex = utils.findIndex(checkedElements, checkCB);

    return intersectedItemIndex > -1 ? checkedElements[intersectedItemIndex] : null;
  }

  /**
   * Checks, was drop area intersected by drag item
   * @param {dragItem} dragItem
   * @param {dropArea} dropArea
   * @return {boolean} - return intersection's result
   * @private
   */
  _checkIntersection(dragItem, dropArea) {
    const comparedAreaCoords = dropArea instanceof DropArea ? dropArea.coordinates.default.update() : dropArea.coordinates.currentStart;

    return utils.isIntersectRect(dragItem.coordinates.current.update(), comparedAreaCoords);
  }

  /**
   * Update sibling relations for drag item or drop area with setting new first element, if it will needed.
   * Or update sibling relations for dropped items inside drop areas with some existing inner drag items.
   * @param {dragItem|dropArea} element
   * @param {boolean} [withoutCB = false] - if true, element's siblings will be updated with setting new appropriate first element
   * @param {dragItem[]} array - drag items array (drop area's innerDragItems)
   * @private
   */
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
   * Set new relations for dragItem or dropArea for keyboard access
   * @param {dragItem|dropArea} element
   * @param {dropAreas[]|dragItems[]} elementsArray - array with siblings elements
   * @param {dragItem|dropArea} firstCurrentElement - first remaining drag item or first allowed drop area (optional)
   * @param {function} setFirstCurrentElementCB - callback-function for setting a first element (optional)
   * @private
   */
  _updateElementSiblings(element, elementsArray, firstCurrentElement, setFirstCurrentElementCB) {
    if (!element.siblings.next && !element.siblings.prev) {

      /**
       * If drag item was returned to remaining drag items from drop area
       */

      const returnedItemIndex = utils.findIndex(elementsArray, (remainingItem) => remainingItem === element);
      const closestElements = this._getClosestArraySiblings(elementsArray, returnedItemIndex);

      this._includeToSiblings(element, closestElements, elementsArray, firstCurrentElement, setFirstCurrentElementCB);
    } else {
      /**
       * If drag item was leaved from remaining drag items to drop area
       */

      this._excludeFromSiblings(element, firstCurrentElement, setFirstCurrentElementCB);
    }
  }

  /**
   * Returns closest elements (previous and next) for an element just inserted into an array (for keyboard access).
   * @param {dragItem[]|dropArea[]} elementsArray
   * @param {number} elementIndex - inserted element index in array
   * @return {object} - object with previous and next elements
   * @private
   */
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

  /**
   * @callback setterCallBack
   * @param {dragItem|dropArea} element - new first element
   */

  /**
   * Sets relations with new inserted element
   * @param {dragItem[]|dropArea[]} element
   * @param {object} inArraySiblings - previous and next elements in array
   * @param {dragItem[]|dropArea[]} elementsArray
   * @param {dragItem|dropArea} firstCurrentElement - current first element
   * @param {setterCallBack} setFirstCurrentElementCB - callback with setter for new first element
   * @private
   */
  _includeToSiblings(element, inArraySiblings, elementsArray, firstCurrentElement, setFirstCurrentElementCB) {
    const { prevElement, nextElement } = inArraySiblings;

    prevElement.siblings.next = element;
    element.siblings.prev = prevElement;

    nextElement.siblings.prev = element;
    element.siblings.next = nextElement;

    if (firstCurrentElement !== undefined && firstCurrentElement !== elementsArray[0]) {
      setFirstCurrentElementCB(elementsArray[0]);
    }
  }

  /**
   * Remove relations with excluded from array element
   * @param {dragItem|dropArea} excludedElement
   * @param {dragItem|dropArea} currentFirstElement
   * @param {setterCallBack} setFirstCurrentElementCB - callback with setter for new first element
   * @private
   */
  _excludeFromSiblings(excludedElement, currentFirstElement, setFirstCurrentElementCB) {
    excludedElement.siblings.prev.siblings.next = excludedElement.siblings.next;
    excludedElement.siblings.next.siblings.prev = excludedElement.siblings.prev;

    if (currentFirstElement === excludedElement) {
      const newFirstElement = excludedElement.siblings.next !== excludedElement ? excludedElement.siblings.next : null;

      setFirstCurrentElementCB(newFirstElement);
    }

    this._resetSiblings(excludedElement);
  }

  _resetSiblings(dragItem) {
    dragItem.siblings.next = dragItem.siblings.prev = null;
  }

  _resetAllSiblings(elementsArray) {
    elementsArray.forEach((item) => this._resetSiblings(item));
  }

  /**
   * Updates siblings relations for only existing drag items case (drop areas aren't existed)
   * @param {dragItem[]} elementsArray
   * @private
   */
  _replaceSiblings(elementsArray) {
    this._resetAllSiblings(elementsArray);
    this._initSiblings(elementsArray, false);
    this.remainingFirstDragItem = elementsArray[0];
  }

  /**
   * Initialises element's siblings relations
   * @param {dragItems[]|dropAreas[]} dndElements - drag items or drop areas array for setting element's siblings relations
   * @param {boolean} resetIndex - if  true, we set new indexes since 0, otherwise indexes aren't
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
        item.translateTo(this.initDragItemsPlaces[index], true, () => item.coordinates.currentStart.update());
      });
    }
  }

  /**
   * Replaces drag items (for only drag items case (without existing drop areas))
   * @param {dragItem} dragItem1
   * @param {dragItem} dragItem2
   * @public
   */
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
   * @public
   */
  replaceDragItems(dragItem1, dragItem2) {
    const firstItemStartCoordinates = merge.recursive(true, {}, dragItem1.coordinates.currentStart);
    const secondItemStartCoordinates = merge.recursive(true, {}, dragItem2.coordinates.currentStart);

    dragItem1.translateTo(secondItemStartCoordinates, true, () => dragItem1.coordinates.currentStart.update());
    dragItem2.translateTo(firstItemStartCoordinates, true, () => dragItem2.coordinates.currentStart.update());

    utils.replaceArrayItems(this.remainingDragItems, dragItem1, dragItem2);
    this._replaceSiblings(this.remainingDragItems);
    this._finishDrag({
      remainingDragItems: this.remainingDragItems,
      dragItems: this.dragItems,
      dragItem1,
      dragItem2
    });
  }

  /**
   * Move drag item after or before selected other drag item. Other drag items will be shifted
   * (for only drag items case (without existing drop areas)
   * @param {dragItem} dragItem
   * @param {dragItem} toDragItem
   * @public
   */
  moveDragItems(dragItem, toDragItem) {
    utils.moveArrayItems(this.remainingDragItems, this.remainingDragItems.indexOf(dragItem),
                              this.remainingDragItems.indexOf(toDragItem));

    this.remainingDragItems.forEach((item) => {
      item.translateTo(this.initDragItemsPlaces[item.index], true, () => item.coordinates.currentStart.update());
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
   * Merge user settings with default settings and apply them.
   * @param {DndSettings} settings
   * @private
   */
  _applySettings(settings) {
    /**
     * @type DndSettings
     */
    const elementsSettingNames = ['dragItems', 'dropAreas', 'container'];

    this.settings = merge.recursive(true, {}, this.constructor.DEFAULT_SETTINGS, settings);
    this.settings.commonDragItemsSettings.disabledClassName = this.settings.commonDropAreasSettings.disabledClassName
      = this.settings.disabledClassName;

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
      this.initDragItemsPlaces[index] = merge.recursive(true, {}, item.coordinates.default);
    });
  }

  /**
   * Creates hidden containers for aria descriptions
   * @param {dragItem[]|dropAreas[]} dndElems
   * @private
   */
  setHiddenAriaContainerFor(dndElems) {
    dndElems.forEach((item) => {
      item.initOwnAriaDescElement(this.hiddenDescContainer);
    });
  }

  /**
   * Checks and fix user settings
   * @param {string} settingName - checked property.
   * @param {string|number|object|boolean} settingValue - checked property value
   * @return {string|number|object|boolean|dragItem|dropArea} - return verified value
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
              utils.showSettingError(settingName, settingValue, `Please set object in each element of ${settingName}.`);
            }

            return dndElement;
          });
        } else {
          utils.showSettingError(settingName, settingValue, `Please set Array of ${settingName}.`);
        }
        break;
      case 'bounds':
        if (Array.isArray(settingValue)) {
          const isValidBoundsArray = settingValue.length === BOUNDS_ARRAY_LENGTH
                                     && settingValue.every((item) => !isNaN(+item) && item >= 0)
                                     && (settingValue[0] < settingValue[2] && settingValue[1] < settingValue[3]);

          if (!isValidBoundsArray) {
            utils.showSettingError(settingName, settingValue, 'Please set array of 4 positive numbers as [x0, y0, x1, y1]');
          }
          verifiedValue = {
            left: settingValue[0],
            top: settingValue[1],
            right: settingValue[2],
            bottom: settingValue[3]
          };
        } else {
          verifiedValue = utils.getElement(settingValue) || document.documentElement;
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
        verifiedValue = utils.checkOnBoolean(settingValue);

        if (verifiedValue === null) {
          utils.showSettingError(settingName, settingValue, 'Please set true or false.');
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
          utils.showSettingError(settingName, settingValue, 'Please set function as event handler.');
        }
        break;
      case 'container':
        verifiedValue = utils.getElement(settingValue);

        if (!verifiedValue) {
          utils.showSettingError(settingName, settingValue, 'Please set html-node element or html-selector');
        }

        verifiedValue.setAttribute('role', 'application');
        break;
      case 'disabledClassName':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
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
      default: {
        const currentSetting = this.getSetting(name);

        this.setSetting(name, typeof currentSetting === 'object' ? merge.recursive(true, {}, currentSetting, value) : value);
      }
    }
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

  /**
   * Creates hidden container for all aria descriptions
   * @private
   */
  _createHiddenDescriptionBlock() {
    this.constructor.AT_PAGE_DND_COUNTER++;

    this.hiddenDescContainer = utils.createHTML({
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
      this.firstAllowedDropArea.tabIndex = -1;
    } else {
      this._resetOnlyDragItemsCase(params);
    }
  }

  resetIncorrectItems() {
    if (this.dropAreas) {
      this.dropAreas.forEach((area) => area.resetIncorrectDragItems());

      if (this._isNothingToReplaceInDropAreas()) {
        this.firstAllowedDropArea.tabIndex = -1;
      }
    }
  }

  disable() {
    this.dragItems.forEach((item) => item.disable());
    this.dropAreas.forEach((area) => area.disable());
  }

  enable() {
    this.dragItems.forEach((item) => item.enable());
    this.dropAreas.forEach((area) => area.enable());

    this.remainingFirstDragItem.tabIndex = 0;
  }

  /**
   * Removes all events emitters and handlers
   * @public
   */
  destroy() {
    this._removeEventsHandlers(this.constructor.EVENTS);
    this._removeEventsHandlers(DragItem.EVENTS);

    this.dragItems.forEach((item) => item.handler.removeEventListener(this.deviceEvents.dragStart, item.onMouseDownHandler));
    this._removeStandardEventsHandlers(this.dragItems);
    this.dropAreas && this._removeStandardEventsHandlers(this.dropAreas);
  }

  _removeEventsHandlers(eventsObj) {
    for (const key in eventsObj) {
      if (eventsObj.hasOwnProperty(key)) {
        this.removeAllListeners(eventsObj[key]);
      }
    }
  }

  _removeStandardEventsHandlers(elems) {
    elems.forEach((elem) => {
      elem.node.removeEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, elem.onKeyDownHandler);
      elem.node.removeEventListener(this.constructor.STANDARD_EVENTS.CLICK, elem.onClickHandler);
    });
  }

  /**
   * Reset dragItems for case, when drop areas aren't exist
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

  /**
   * Exclude correct drag items from keyboard focus access for only drag items case (drop areas aren't exist)
   */
  disableFocusOnCorrectItems() {
    const toRemoveFromRemainingItems = [];

    this.remainingDragItems.forEach((item) => item.correct && toRemoveFromRemainingItems.push(item));

    if (toRemoveFromRemainingItems.length) {
      toRemoveFromRemainingItems.forEach((item) => {
        this._excludeElementFromArray(this.remainingDragItems, item);
        item.disable();
      });
      this.remainingFirstDragItem = this.remainingDragItems.length ? this.remainingDragItems[0] : null;
    } else {
      this.remainingFirstDragItem = null;
    }
  }

  breakTransition(item) {
    const event = new Event('transitionend');

    item.node.dispatchEvent(event);
  }
}

export default CgDnd;
