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
 * @property {string} selectedDragItemClassName - class name for keyboard's selected dragItem

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
        selectedDragItemClassName: this.CSS_CLASS.SELECTED_DRAG_ITEM,
        commonDragItemsSettings: {
          handler: '',
          initAriaKeyboardAccessDesc: 'Use arrow keys or swipes to choose element,'
                                      + ' then press space button or make double touch to select it',
          initAriaElementDesc: '',
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
          initAriaKeyboardAccessDesc: 'Use arrow keys or swipes to choose element,'
                                      + ' then press space button or make double touch to put drag item inside',
          initAriaElementDesc: '',
          snapAlignParams: {
            withShift: true,
            withDroppedItemCSSMargins: false,
            eachDroppedItemIndents: [0],
            horizontalAlign: 'left',
            verticalAlign: 'top'
          }
        },
        tooltipParams: {},
        itemsOrderReadingParams: {
          enabled: false,
          liveTextElement: '',
          hotKeyCode: 113,
          usageInstruction: ' Press F2 to read current order of items. ',
          getItemsCurrentOrderDesc: (currentItems) => {
            let desc = '';

            currentItems.forEach((item, index) => {
              desc += ` ${item.ariaLabel} - position ${index + 1} of ${currentItems.length}. `;
            });

            return desc;
          }
        },
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
      CURRENT_DRAGGED_ITEM: `${this.DND_CLASS}-current-dragged-item`,
      SELECTED_DRAG_ITEM: `${this.DND_CLASS}-selected-item`
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
        KEYUP: 'keyup',
        CLICK: 'click',
        BLUR: 'focusout'
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

  set areRemainingDragitemsHiddenFromTabletsFocus(flag) {
    this._areRemainingDragitemsHiddenFromTabletsFocus = flag;
  }

  get areRemainingDragitemsHiddenFromTabletsFocus() {
    if (this._areRemainingDragitemsHiddenFromTabletsFocus === undefined) {
      this._areRemainingDragitemsHiddenFromTabletsFocus = false;
    }

    return this._areRemainingDragitemsHiddenFromTabletsFocus;
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
      item.onKeyUpHandler = this._onKeyUp.bind(this, item);
      item.onClickHandler = this._onDragItemClick.bind(this, item);
      item.onBlurHandler = this._onBlur.bind(this, item);

      item.handler.addEventListener(this.deviceEvents.dragStart, item.onMouseDownHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, item.onKeyDownHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYUP, item.onKeyUpHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.CLICK, item.onClickHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.BLUR, item.onBlurHandler);
    });

    if (this.dropAreas) {
      this.dropAreas.forEach((area) => {
        area.onKeyDownHandler = this._onKeyDown.bind(this, area);
        area.onKeyUpHandler = this._onKeyUp.bind(this, area);
        area.onClickHandler = this._onDropAreaClick.bind(this, area);
        area.onBlurHandler = this._onBlur.bind(this);

        area.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, area.onKeyDownHandler);
        area.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYUP, area.onKeyUpHandler);
        area.node.addEventListener(this.constructor.STANDARD_EVENTS.CLICK, area.onClickHandler);
        area.node.addEventListener(this.constructor.STANDARD_EVENTS.BLUR, area.onBlurHandler);
      });
    }

    this.on(DragItem.EVENTS.DRAG_ITEM_RESET, this._onDragItemReset);
    this.on(DragItem.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this._onDragItemDroppedOnDropArea);
  }

  _readItemsCurrentOrder() {
    const params = this.settings.itemsOrderReadingParams;

    params.liveTextElement.innerHTML = '';
    params.liveTextElement.innerHTML = params.getItemsCurrentOrderDesc(this.remainingDragItems);
  }

  _onMouseDown(item, e) {
    if (!item.disabled) {
      e.preventDefault();

      this.isClick = true;

      if (item.hasTransition()) {
        item.breakTransition();
      }

      const box = utils.getElementPosition(item.node);
      const pageX = e.pageX || e.touches[0].pageX;
      const pageY = e.pageY || e.touches[0].pageY;

      item.shiftX = pageX - box.left;
      item.shiftY = pageY - box.top;

      const boundsParams = this.settings.bounds instanceof Element
        ? utils.getElementPosition(this.settings.bounds)
        : this.settings.bounds;

      this._removeCurrentDraggedItemSelection();
      this.currentDragParams = {
        draggedItem: item,
        currentBounds: utils.calculateCurrentBounds(box, boundsParams, pageX, pageY),
        initPosition: {
          x: pageX,
          y: pageY
        },
        chosenDraggedItem: this.currentDragParams ? this.currentDragParams.chosenDraggedItem : item
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

    if (this.isClick) {
      if (e.movementX !== undefined && e.movementY !== undefined) {
        this.isClick = !e.movementX && !e.movementY;
      } else {
        this.isClick = pageX === this.currentDragParams.initPosition.x && pageY === this.currentDragParams.initPosition.y;
      }
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
    if (!this.isClick) {
      /**
       * If isClick flag wasn't set, then we are changing drag item position
       * by mousemove or touchmove and then we should check it's position
       */
      this._checkDragItemPosition(this.currentDragParams.draggedItem);
    } else if (utils.IS_TOUCH) {
      /**
       * Some screenreaders (TB on android 7 for example) on touch devices fires touchstart and touchend events instead click-event
       * during double touch, then we call it here by hands. (TB on android 8 fires click-event during double touch, when TB is enabled)
       */
      this.currentDragParams.draggedItem.node.click();
    }
    e.preventDefault();

    document.removeEventListener(this.deviceEvents.dragMove, this.onMouseMoveHandler);
    document.removeEventListener(this.deviceEvents.draEnd, this.onMouseUpHandler);
  }

  /**
   * Handler on drag item resetting
   * @param {Object} params
   * @param {dragItem} params.dragItem
   * @param {dropArea} params.chosenDropArea - drop area, in which drag item is placed
   * @param {boolean} params._shiftRemainingItems - if "true", remaining drag items will be aligned
   * (if settings.alignRemainingDragItems === true). It's needed for disabling double remaining drag items shifting during replacing
   * @private
   */
  _onDragItemReset(params) {
    const { dragItem, chosenDropArea, _shiftRemainingItems } = params;

    if (this.remainingDragItems.indexOf(dragItem) === -1) {
      /**
       * If dropArea includes reseted drag item, we exclude it from dropArea
       */
      if (chosenDropArea) {
        this._removeFromDropArea(dragItem, chosenDropArea);
      }

      this._insertToRemainingDragItems(dragItem, _shiftRemainingItems);
    }

    if (chosenDropArea && this.allowedDropAreas.indexOf(chosenDropArea) === -1) {
      this._includeElementToArray(this.allowedDropAreas, chosenDropArea);
    }
  }

  _onKeyDown(item, e) {
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
        break;
      case this.settings.itemsOrderReadingParams.hotKeyCode:
        if (this.settings.itemsOrderReadingParams.enabled) {
          e.preventDefault();
          this._readItemsCurrentOrder();
        }
        break;
      default:
    }
  }

  /**
   * We select element by keyup-event, because otherwise FF dispatches click-event on next focused DOM-element (not dnd),
   * if in it's "space"-keydown handler focus will be set on this next element.
   * Is relevant, when after last drag item was set to drop area,
   * we set focus on check/submit button ( in case, when selecting will be appeared by keydown-event on "space" button,
   * FF clicks on this button at once after focus - it's wrong. KeyUp fixes it).
   * @param {dragItem|dropArea} item - dnd element
   * @param {Object} e - event
   * @private
   */
  _onKeyUp(item, e) {
    const KEY_CODES = this.constructor.KEY_CODES;

    if (e.keyCode === KEY_CODES.SPACE || e.keyCode === KEY_CODES.ENTER) {
      this.isClick = true;
      item.select();
    }
  }

  /**
   * Set tabindex="0" for first allowed drop area, when drag element is selected and drop area lose focus
   * @param {Object} e - focusout-event
   * @private
   */
  _onBlur(e) {
    if (this.currentDragParams && this.firstAllowedDropArea && !this.isFocusOnDropArea(e)) {
      this.firstAllowedDropArea.tabIndex = 0;
    }
  }

  /**
   * Check, is next focused element has dropArea css-class
   * @param {Object} e - focusout-event
   * @return {boolean} result
   */
  isFocusOnDropArea(e) {
    return e.relatedTarget && e.relatedTarget.classList.contains(DropArea.CG_ELEM_CLASS);
  }

  /**
   * Handler on drag item, which is selected by space/enter or touch event with enabled screenreader
   * @param {dragItem} item
   * @param {object} e
   * @private
   */
  _onDragItemClick(item, e) {
    /**
     * We set isClick flag for case, when we click on item by mouse or for touch devices, which fires touchstart and touchend events
     * instead click-event during double touch with enabled screenreader.
     * Also we check this flag on "undefined", if touch-devices screenreaders fires click-event at once instead touchstart
     * and touchend events (TB on Android 8 for example)
     */
    if (this.isClick || this.isClick === undefined) {
      /**
       * Check for android - is click event was fired on dragItem or dropArea (if dragItem is placed on the center of dropArea)
       */
      if (!item.disabled && (!utils.IS_TOUCH || (utils.IS_TOUCH && !item.ariaHidden))) {
        this._removeCurrentDraggedItemSelection();
        this.currentDragParams = {
          draggedItem: item,
          /**
           * This chosenDraggedItem property is needed for case, when only drag items are exist
           */
          chosenDraggedItem: this.currentDragParams ? this.currentDragParams.chosenDraggedItem : item
        };
        this.currentDragParams.draggedItem.ariaGrabbed = true;
        this.currentDragParams.draggedItem.addClass(this.settings.selectedDragItemClassName);

        /**
         * Add copy of currentDragParams, which will be needed, when we try replace drag items,
         * one or both of which are inside drop area and were occupied center of drag item. Otherwise we will lose current dragged item,
         * because TalkBack on Android makes physical click on the center of the element (in the center of which there is drag item),
         * therefore fires touchstart event on this drag item instead drop area.
         */
        this.forTalkBackCurrentDragParams = merge({}, this.currentDragParams);

        if (this.dropAreas) {
          this.allowedDropAreas.forEach((area) => {
            area.ariaDropEffect = 'move';
            area.ariaHidden = false;
          });
        }

        this.emit(this.constructor.EVENTS.DRAG_START, e, item);
        this.emit(this.constructor.EVENTS.DRAG_ITEM_SELECT, e, {
          dragItem: item,
          chosenDraggedItem: this.currentDragParams.chosenDraggedItem,
          dropAreas: this.dropAreas,
          allowedDropAreas: this.allowedDropAreas,
          firstAllowedDropArea: this.firstAllowedDropArea
        });
        this.isClick = undefined;
      } else if (utils.IS_TOUCH && item.chosenDropArea) {
        /**
         * We fire click-event on dropArea, inside of which this drag item is located,
         * because TalkBack on Android makes physical click on the center of the element (in the center of which there is drag item),
         * therefore fires touchstart event on this drag item instead drop area.
         */
        item.chosenDropArea.select();
      }
    }
  }

  /**
   * Handler on drop area, which is selected by space/enter or touch event with enabled screenreader
   * @param {dropArea} area
   * @param {object} e
   * @private
   */
  _onDropAreaClick(area, e) {
    if (utils.IS_TOUCH) {
      this.currentDragParams = this.forTalkBackCurrentDragParams;
    }

    if (!area.disabled) {
      if (!this.currentDragParams && this.settings.possibleToReplaceDroppedItem) {
        area.addTabletsAccessForInnerDragItems();
        this._forbidTabletsFocusForRemainingDragItems();
      }

      this._removeCurrentDraggedItemSelection();
      this.emit(this.constructor.EVENTS.DROP_AREA_SELECT, e, {
        dropArea: area,
        droppedItems: area.innerDragItems,
        currentDraggedItem: this.currentDragParams ? this.currentDragParams.draggedItem : null,
        remainingDragItems: this.remainingDragItems
      });
    }
    this.forTalkBackCurrentDragParams = null;
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

        dragItem.putIntoDropArea({ dropArea: chosenDropArea });
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
   * @param {Object} params
   * @param {dragItem} params.dragItem
   * @param {dropArea} params.dropArea
   * @param {boolean} params._shiftRemainingItems - if "true", remaining drag items will be aligned
   * (if settings.alignRemainingDragItems === true). It's needed for disabling double remaining drag items shifting during replacing
   * @param {boolean} params.isSameDropArea - if true, drag item returns back to chosen drop area's position
   * @private
   */
  _onDragItemDroppedOnDropArea(params) {
    const { dragItem, dropArea, isSameDropArea, _shiftRemainingItems } = params;

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

      delete forUserArgs.dropArea;
      this._finishDrag(forUserArgs);

      return;
    }

    const previousDropArea = dragItem.chosenDropArea;

    if (previousDropArea) {
      this._removeFromDropArea(dragItem, previousDropArea);
    } else {
      this._removeFromRemainingDragItems(dragItem, _shiftRemainingItems);
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

    this._finishDrag(merge({}, forUserArgs, { previousDropArea }));
  }

  /**
   * Add dragItem to DropArea's innerDragItems property with updating dragItem's siblings elements for keyboard access
   * @param {dragItem} dragItem
   * @param {dropArea} dropArea
   * @private
   */
  _insertToDropArea(dragItem, dropArea) {
    dropArea.placeDragItem(dragItem);
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
    dropArea.removeDragItem(dragItem);
    this._resetSiblings(dragItem);
  }

  /**
   * Remove dragItem from remaining drag items array with shifting other remaining drag items, if it will be needed
   * @param {dragItem} dragItem
   * @param {boolean} [isNeedForShift = true] - if "true", remaining drag items will be aligned
   * (if settings.alignRemainingDragItems === true). It's needed for disabling double remaining drag items shifting during replacing
   * @private
   */
  _removeFromRemainingDragItems(dragItem, isNeedForShift = true) {
    this._excludeElementFromArray(this.remainingDragItems, dragItem);

    isNeedForShift && this._shiftRemainingDragItems();
  }

  _insertToRemainingDragItems(dragItem, isNeedForShift = true) {
    this._includeElementToArray(this.remainingDragItems, dragItem);

    if (this.dropAreas && isNeedForShift) {
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
    return !this.settings.possibleToReplaceDroppedItem || !this._dropAreasHaveDragItems();
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
    const isNothingToReplaceInDropAreas = this._isNothingToReplaceInDropAreas();

    this._allowTabletsFocusForRemainingDragItems();
    this.emit(this.constructor.EVENTS.DRAG_STOP, null, params);
    this._removeCurrentDraggedItemSelection();

    if (this.allowedDropAreas) {
      this.allowedDropAreas.forEach((area) => {
        area.ariaDropEffect = '';
        area.ariaHidden = isNothingToReplaceInDropAreas;
        area.removeTabletsAccessForInnerDragItems();
      });

      if (isNothingToReplaceInDropAreas && this.firstAllowedDropArea) {
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
        if (this.firstAllowedDropArea) {
          this.firstAllowedDropArea.tabIndex = -1;
        }

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
    if (this.settings.alignRemainingDragItems) {
      this.remainingDragItems.forEach((item, index) => {
        if (item.isNeedForShiftTo(this.initDragItemsPlaces[index])) {
          item.translateTo(this.initDragItemsPlaces[index], true, () => item.coordinates.currentStart.update());
        }
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

    utils.replaceArrayItems(this.remainingDragItems, dragItem1, dragItem2);
    this._replaceSiblings(this.remainingDragItems);

    dragItem1.translateTo(secondItemStartCoordinates, true, () => this._updateDragItem(dragItem1, secondItemStartCoordinates));
    dragItem2.translateTo(firstItemStartCoordinates, true, () => this._updateDragItem(dragItem2, firstItemStartCoordinates));


    if (utils.IS_TOUCH) {
      /**
       * We change DOM-tree for touch devices -> focus will be disappear, so we set it again
       */
      dragItem2.focus();
    } else {
      /**
       * Set focus, that screenreader will read element with it's new position
       */
      dragItem2.focus({ delay: 0 });
    }

    this._finishDrag({
      remainingDragItems: this.remainingDragItems,
      dragItems: this.dragItems,
      dragItem1,
      dragItem2
    });
  }

  /**
   * Update drag item coordinates for "only drag items are exist" case
   * @param {dragItem} item
   * @param {object} newPositionDOMRectCoordinates - DOM-rect coordinates of new dragItem position
   * @private
   */
  _updateDragItem(item, newPositionDOMRectCoordinates) {
    if (utils.IS_TOUCH) {
      /**
       * If it is a touch device, we translate DOM-element of drag item to new position's order for right focus by touch screenreaders
       */
      this._updateNodeDOMPosition(item, newPositionDOMRectCoordinates);
    } else {
      item.coordinates.currentStart.update();
    }
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

    this._replaceSiblings(this.remainingDragItems);

    if (utils.IS_TOUCH) {
      /**
       * We change DOM-tree for right focus by touch screenreaders, like TalkBack or VoiceOver
       */
      this._updateAllNodesDOMPositions([...this.dragItems]);

      /**
       * We change DOM-tree for touch devices -> focus will disappear, so we set it again
       */
      dragItem.focus();
    } else {
      this.remainingDragItems.forEach((item) => {
        item.translateTo(this.initDragItemsPlaces[item.index], true, () => item.coordinates.currentStart.update());
      });

      /**
       * Set focus, that screenreader will read element with it's new position
       */
      dragItem.focus({ delay: 0 });
    }

    this._finishDrag({
      remainingDragItems: this.remainingDragItems,
      dragItems: this.dragItems,
      dragItem1: dragItem,
      dragItem2: toDragItem
    });
  }

  /**
   * Replace drag items in DOM depending on which order they are shown on the screen. It's needed for right focus by touch screenreaders
   * @param {dragItem} dragItem
   * @param {object} newPositionDOMRectCoordinates - DOM-rect coordinates of new dragItem position
   * @param {boolean} resetToDefault - flag for reset drag items
   * @private
   */
  _updateNodeDOMPosition(dragItem, newPositionDOMRectCoordinates, resetToDefault = false) {
    dragItem.node.style.transform = '';

    if (!resetToDefault && dragItem.index < this.dragItems.length - 1) {
      const lowerDOMSibling = this.dragItems[utils.findIndex(this.dragItems, (elem) => elem.index === dragItem.index + 1)].node;

      dragItem.node.parentElement.insertBefore(dragItem.node, lowerDOMSibling);
    } else {
      dragItem.node.parentElement.appendChild(dragItem.node);
    }

    dragItem.updateAllCoordinates(newPositionDOMRectCoordinates);
  }

  /**
   * Move all drag items in DOM depending on which order they are shown on the screen
   * @param {dragItem[]} elemsArray - dragItem's array
   * @private
   */
  _updateAllNodesDOMPositions(elemsArray) {
    /**
     * Sort array to add nodes down up
     */
    elemsArray.sort((elem1, elem2) => elem2.index - elem1.index);

    /**
     * Moves DOM-nodes in first element's animation end callback, that they were updated sequentially.
     * Otherwise, animations will not be ended sequentially and DOM elements will be moved randomize
     */
    elemsArray[0].translateTo(this.initDragItemsPlaces[elemsArray[0].index], true, () => {
      elemsArray.forEach((item) => this._updateNodeDOMPosition(item, this.initDragItemsPlaces[item.index]));
    });

    for (let i = 1; i < elemsArray.length; i++) {
      elemsArray[i].translateTo(this.initDragItemsPlaces[elemsArray[i].index], true);
    }
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

    this.tooltip = new Tooltip(this.settings.tooltipParams);

    this.remainingDragItems = [...this.dragItems];
    this.allowedDropAreas = this.dropAreas ? [...this.dropAreas] : null;
    this.initDragItemsPlaces = [];
    this.dragItems.forEach((item, index) => {
      this.initDragItemsPlaces[index] = merge.recursive(true, {}, item.coordinates.default);

      /**
       * Set hotkey postfix instruction for reading current items order
       */
      if (this.settings.itemsOrderReadingParams.enabled && !utils.IS_TOUCH) {
        item.keyboardDescPostfix = this.settings.itemsOrderReadingParams.usageInstruction;
      }
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
  /* eslint-disable max-statements */
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
      case 'enabled':
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
      case 'selectedDragItemClassName':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      case 'itemsOrderReadingParams':
        if (typeof settingValue === 'object') {
          for (const key in settingValue) {
            if (settingValue.hasOwnProperty(key)) {
              settingValue[key] = this._checkSetting(key, settingValue[key]);
            }
          }

          verifiedValue = settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set Object.');
        }
        break;
      case 'liveTextElement':
        if (this.settings.itemsOrderReadingParams.enabled) {
          verifiedValue = utils.getElement(settingValue);

          if (!verifiedValue) {
            utils.showSettingError(settingName, settingValue, 'Please set html-node element or html-selector');
          }
        }
        break;
      case 'hotKeyCode':
        if (typeof +settingValue === 'number') {
          verifiedValue = +settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set keyCode number');
        }
        break;
      case 'usageInstruction':
        if (typeof settingValue === 'string' && settingValue.length) {
          verifiedValue = settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set not empty string');
        }
        break;
      case 'getItemsCurrentOrderDesc':
        if (typeof settingValue === 'function') {
          verifiedValue = settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set function');
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
      this.dropAreas.forEach((area) => {
        area.resetInnerDragItems({ removedClassName: params.removedClassName });
        area.ariaHidden = true;
      });
      this.firstAllowedDropArea.tabIndex = -1;
    } else {
      this._resetOnlyDragItemsCase(params);
    }

    this._removeCurrentDraggedItemSelection();
    this.currentDragParams = null;
  }

  resetIncorrectItems() {
    if (this.dropAreas) {
      this.dropAreas.forEach((area) => area.resetIncorrectDragItems());

      if (this._isNothingToReplaceInDropAreas()) {
        this.dropAreas.forEach((area) => {
          area.ariaHidden = true;
        });

        if (this.firstAllowedDropArea) {
          this.firstAllowedDropArea.tabIndex = -1;
        }
      }
    }

    this._removeCurrentDraggedItemSelection();
    this.currentDragParams = null;
  }

  _removeCurrentDraggedItemSelection() {
    if (this.currentDragParams) {
      this.currentDragParams.draggedItem.ariaGrabbed = false;
      this.currentDragParams.draggedItem.removeClass(this.settings.selectedDragItemClassName);
    }
  }

  /**
   * Disable all dnd's elements
   * @public
   */
  disable() {
    this.dragItems.forEach((item) => item.disable());
    this.dropAreas.forEach((area) => area.disable());
  }

  /**
   * Enable all dnd's elements
   * @public
   */
  enable() {
    const areDroppedItemsPossibleToReplace = !this._isNothingToReplaceInDropAreas();

    this.dragItems.forEach((item) => item.enable());
    this.dropAreas.forEach((area) => {
      area.enable();

      /**
       * We remove from tablet's focused elements drop areas, if there are not dropped items to replace
       */
      if (!areDroppedItemsPossibleToReplace) {
        area.ariaHidden = true;
      }
    });

    this.remainingFirstDragItem.tabIndex = 0;
    this.firstAllowedDropArea.tabIndex = areDroppedItemsPossibleToReplace ? 0 : -1;
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
      elem.node.removeEventListener(this.constructor.STANDARD_EVENTS.KEYUP, elem.onKeyUpHandler);
      elem.node.removeEventListener(this.constructor.STANDARD_EVENTS.CLICK, elem.onClickHandler);
    });
  }

  /**
   * Reset dragItems for case, when drop areas aren't exist
   * @param {object} params
   */
  _resetOnlyDragItemsCase(params = {}) {
    this.dragItems.forEach((item, index) => {
      item.reset({
        coordinates: this.initDragItemsPlaces[index],
        removedClassName: params.removedClassName,
        afterAnimationCB: () => {
          utils.IS_TOUCH && this._updateNodeDOMPosition(item, merge.recursive(true, {}, this.initDragItemsPlaces[index]), true);
          /**
           * After last item's animation end we call user callback
           */
          if (index === this.dragItems.length - 1 && params.afterAnimationCB) {
            params.afterAnimationCB();
          }
        }
      });
    });

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
    }

    this.remainingFirstDragItem = this.remainingDragItems.length ? this.remainingDragItems[0] : null;
    this._removeCurrentDraggedItemSelection();
    this.currentDragParams = null;
  }

  /**
   * Hide remaining drag items from tablet's screenreader focus. (It's needed, when we navigate on drop area's inner drag items)
   */
  _forbidTabletsFocusForRemainingDragItems() {
    if (!this.areRemainingDragitemsHiddenFromTabletsFocus) {
      this.remainingDragItems.forEach((item) => {
        item.ariaHidden = true;
      });
    }

    this.areRemainingDragitemsHiddenFromTabletsFocus = true;
  }

  /**
   * Show remaining drag items for tablet's screenreader focus.
   */
  _allowTabletsFocusForRemainingDragItems() {
    if (this.areRemainingDragitemsHiddenFromTabletsFocus) {
      this.remainingDragItems.forEach((item) => {
        item.ariaHidden = false;
      });
    }

    this.areRemainingDragitemsHiddenFromTabletsFocus = false;
  }
}

export default CgDnd;
