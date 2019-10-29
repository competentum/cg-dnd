import './common.less';

import EventEmitter from 'events';
import merge from 'merge';
import utils from 'utils';
import DragItem from 'DragItem';
import DropArea from 'DropArea';
import Tooltip from 'Tooltip';
import debounce from 'lodash.debounce';
import { onDragItemSelect, onDropAreaSelect } from './defaultHandlers';

const RESIZE_CALC_FREQUENCY = 150;

const DROP_AREA_STATUSES = {
  empty: 'empty',
  filled: 'filled',
  multipleFilled: 'multipleFilled'
};

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
        debouncedResize: false,
        a11yTexts: {
          announced: {
            onReset: 'All items were reset.',
            onIncorrectResetOnly: 'All incorrect items ware reset.',
            onFilledAreaAttempt: 'Area is not empty.',
            onOverFilledAreaAttempt: 'Area is completely full.'
          },
          descriptions: {
            dragItem: {
              state: {
                initial: '',
                insideArea: (item) => {
                  return item.chosenDropArea ? `This item is located inside the area - ${item.chosenDropArea}.` : '';
                }
              },
              usage: {
                initial: 'Press space to select the item. Use arrows keys to navigate between items.',
                insideArea: 'Press space to select the item. Use arrows keys to navigate between another dropped items inside this area.',
              }
            },
            dropArea: {
              state: {
                [DROP_AREA_STATUSES.empty]: 'Is empty.',
                [DROP_AREA_STATUSES.filled]: (area) => `Area is filled by the item - ${area.innerDragItems[0].ariaLabel}`,
                [DROP_AREA_STATUSES.multipleFilled]: (area) => {
                  const innerItems = area.innerDragItems.reduce((item) => `${item.ariaLabel};`, '');

                  return `Area contains the ${area.innerDragItems.length} items: ${innerItems}`;
                }
              },
              usage: {
                withReplace: {
                  static: {
                    [DROP_AREA_STATUSES.empty]: 'Choose item first. Use arrows keys to navigate between areas.',
                    [DROP_AREA_STATUSES.filled]: 'Press space to select the element inside the area for its replacing. Use arrows keys to'
                        + ' navigate between areas.',
                    [DROP_AREA_STATUSES.multipleFilled]: 'Press space to navigate between dropped in items for its replacing.'
                    + ' Use arrows keys to navigate between areas.'
                  },
                  dragging: {
                    [DROP_AREA_STATUSES.empty]: 'Press space to place the grabbed item to this area. Use arrows keys to'
                    + ' navigate between areas.',
                    [DROP_AREA_STATUSES.filled]: 'Press space to replace the dropped item in this area by the grabbed item.'
                        + ' Use arrows keys to navigate between areas.',
                    [DROP_AREA_STATUSES.multipleFilled]: 'Press space to place the grabbed item to this area. Use arrows'
                    + ' keys to navigate between areas.',
                    sameArea: 'Press space to remain the item at the current area.'
                  }
                },
                withoutReplace: {
                  static: 'Choose item first. Use arrows keys to navigate between areas.',
                  dragging: 'Press space to place the grabbed item to this area. Use arrows keys to navigate between areas.'
                }
              }
            },
            orderCase: {}
          }
        },
        commonDragItemsSettings: {
          handler: '',
          selectedItemClassName: this.CSS_CLASS.SELECTED_DRAG_ITEM,
          initialAriaKeyboardDesc: 'Use arrow keys or swipes to choose element,'
                                      + ' then press space button or make double touch to select it.',
          initialAriaElementDesc: '',
          tooltipParams: {},
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
          initialAriaKeyboardDesc: 'Use arrow keys or swipes to choose element,'
                                      + ' then press space button or make double touch to put drag item inside.',
          initialAriaElementDesc: '',
          tooltipParams: {},
          snapAlignParams: {
            withShift: true,
            withDroppedItemCSSMargins: false,
            eachDroppedItemIndents: [0],
            horizontalAlign: 'left',
            verticalAlign: 'top'
          }
        },
        tooltipParams: {},
        liveTextElement: null,
        itemsOrderReadingParams: {
          hotkeyCode: 113,
          usageInstruction: '',
          getItemsCurrentOrderDesc: (currentItems) => {
            const sortedItems = [...currentItems].sort((item1, item2) => item1.index - item2.index);
            let desc = '';

            sortedItems.forEach((item) => {
              desc += ` ${item.ariaLabel} - position ${item.index + 1} of ${currentItems.length}. ${item.correct ? 'Correct! ' : ''}`;
            });

            return desc;
          }
        },
        unselectParams: {
          hotkeyCode: 27,
          usageInstruction: ''
        },
        onCreate: () => {},
        onDragStart: () => {},
        onDragMove: () => {},
        onDragStop: () => {},
        onDragItemSelect,
        onDropAreaSelect
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
        BLUR: 'focusout',
        RESIZE: 'resize'
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
    this.firstRemainingDragItem = this.dragItems[0];

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
  set firstRemainingDragItem(dragItem) {
    if (this._firstRemainingDragItem) {
      this._firstRemainingDragItem.tabIndex = -1;
    }

    if (dragItem) {
      this._firstRemainingDragItem = dragItem;
      this._firstRemainingDragItem.tabIndex = 0;
    } else {
      this._firstRemainingDragItem = null;
    }
  }

  /**
   * @return {dragItem} first remaining dragItem
   */
  get firstRemainingDragItem() {
    return this._firstRemainingDragItem;
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
    this._deviceEvents = utils.getDeviceEvents();

    this.dragItems.forEach((item) => {
      item.onMouseDownHandler = this._onMouseDown.bind(this, item);
      item.onKeyDownHandler = this._onElementKeyDown.bind(this, item);
      item.onKeyUpHandler = this._onKeyUp.bind(this, item);
      item.onClickHandler = this._onDragItemClick.bind(this, item);
      item.onBlurHandler = this._onBlur.bind(this, item);

      item.handler.addEventListener(this._deviceEvents.dragStart, item.onMouseDownHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, item.onKeyDownHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.KEYUP, item.onKeyUpHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.CLICK, item.onClickHandler);
      item.node.addEventListener(this.constructor.STANDARD_EVENTS.BLUR, item.onBlurHandler);
    });

    if (this.dropAreas) {
      this.dropAreas.forEach((area) => {
        area.onKeyDownHandler = this._onElementKeyDown.bind(this, area);
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

    this._onResizeHandler = this.settings.debouncedResize
      ? debounce(this._onResize.bind(this), RESIZE_CALC_FREQUENCY)
      : this._onResize.bind(this);

    window.addEventListener(this.constructor.STANDARD_EVENTS.RESIZE, this._onResizeHandler);

    this._onAppKeyDownHandler = this._onAppKeyDown.bind(this);
    this.container.addEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, this._onAppKeyDownHandler);

    this._addDescriptionsListeners();
    this._addUserEventHandlers();
  }

  _addUserEventHandlers() {
    for (const key in this.constructor.EVENTS_HANDLER_RELATIONS) {
      if (this.constructor.EVENTS_HANDLER_RELATIONS.hasOwnProperty(key) && this.settings[key]) {
        this.addListener(this.constructor.EVENTS_HANDLER_RELATIONS[key], this.settings[key]);
      }
    }
  }

  _addDescriptionsListeners() {
    this.addListener(this.constructor.EVENTS.DRAG_START, (e, item) => {
      if (this.dropAreas.length) {
        this.dropAreas.forEach((area) => {
          area.changeCurrentKeyboardDesc(this._getDropAreaDescription(area, item));
        });
      }
    });

    this.addListener(this.constructor.EVENTS.DRAG_STOP, (e, params) => {
      const { a11yTexts: { descriptions: { dragItem: itemDescriptions, dropArea: areaDescriptions } } } = this.settings;

// TODO: add live announce for reset and same drop area
      if (params.isReset) {
        params.dragItem.changeCurrentKeyboardDesc(itemDescriptions.usage.initial);
        params.dragItem.changeCurrentAriaState(itemDescriptions.state.initial);
      } else if (params.isSameDropArea) {
// TODO: add announce
      } else {
        params.dragItem.changeCurrentKeyboardDesc(itemDescriptions.usage.insideArea);
        params.dragItem.changeCurrentAriaState(itemDescriptions.state.insideArea);
      }

      if (this.dropAreas.length) {
        this.dropAreas.forEach((area) => {
          area.changeCurrentKeyboardDesc(areaDescriptions.state[this._getDropAreaStatus(area)]);
        });
      }
    });
  }

  _getDropAreaDescription(dropArea, draggedItem) {
    const { a11yTexts: { descriptions: { dropArea: { usage: usageDesc } } } } = this.settings;
    const isPossibleToReplace = this.settings.possibleToReplaceDroppedItem && dropArea.innerDragItems.length;

    if (isPossibleToReplace) {
      const { withReplace: { dragging: { sameArea: sameAreaDesc } } } = usageDesc;

      return sameAreaDesc && dropArea.innerDragItems.includes(draggedItem)
          ? sameAreaDesc
          : usageDesc.withReplace.dragging[this._getDropAreaStatus(dropArea)];
    }

    return usageDesc.withoutReplace.dragging;
  }

  _getDropAreaStatus(dropArea) {
    const { empty, filled, multipleFilled } = DROP_AREA_STATUSES;

    switch (dropArea.innerDragItems.length) {
      case 0:
        return empty;
      case 1:
        return filled;
      default:
        return multipleFilled;
    }
  }

  _onResize() {
    this.dragItems.forEach((item, index) => {
      const resizeShift = item.updateOnResize();

      this._initialDragItemsCoordinates[index].left -= resizeShift.left;
      this._initialDragItemsCoordinates[index].top -= resizeShift.top;
    });

    this.dropAreas && this.dropAreas.forEach((area) => area.updateOnResize());
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

      document.addEventListener(this._deviceEvents.dragMove, this.onMouseMoveHandler);
      document.addEventListener(this._deviceEvents.draEnd, this.onMouseUpHandler);

      this.emit(this.constructor.EVENTS.DRAG_START, e, item);
      this.isDragStart = true;
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
      this.isDragStart && delete this.isDragStart;
    } else if (utils.IS_TOUCH) {
      /**
       * Some screenreaders (TB on android 7 for example) on touch devices fires touchstart and touchend events instead click-event
       * during double touch, then we call it here by hands. (TB on android 8 fires click-event during double touch, when TB is enabled)
       */
      if (utils.IS_IOS) {
        /**
         * VO on ipad doesn't read next focused element's aria description and role (if we set nextElement.focus() in this handler),
         * if current element has touchstart-event handler. Therefore, we set delay.
         */
        const TOUCH_END_IOS_DELAY = 100;

        setTimeout(() => {
          this.currentDragParams.draggedItem.select();
        }, TOUCH_END_IOS_DELAY);

      } else {
        this.currentDragParams.draggedItem.select();
      }
    }
    e.preventDefault();

    document.removeEventListener(this._deviceEvents.dragMove, this.onMouseMoveHandler);
    document.removeEventListener(this._deviceEvents.draEnd, this.onMouseUpHandler);
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

  _onElementKeyDown(item, e) {
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
      default:
    }
  }

  _onAppKeyDown(e) {
    const { itemsOrderReadingParams, unselectParams } = this.settings;

    switch (e.keyCode) {
      case this.settings.itemsOrderReadingParams.hotkeyCode: {
        const { usageInstruction, getItemsCurrentOrderDesc } = itemsOrderReadingParams;

        if (usageInstruction) {
          e.preventDefault();
          this.setLiveText(getItemsCurrentOrderDesc(this.dragItems));
        }
        break;
      }
      case unselectParams.hotkeyCode: {
        if (unselectParams.usageInstruction) {
          this._finishDrag({
            remainingDragItems: this.remainingDragItems,
            dragItems: this.dragItems,
            dragItem: this.currentDragParams.draggedItem
          });
        }
        break;
      }
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
    if (this.currentDragParams && this.firstAllowedDropArea && !this._isFocusOnDropArea(e)) {
      this.firstAllowedDropArea.tabIndex = 0;
    }
  }

  /**
   * Check, is next focused element has dropArea css-class
   * @param {Object} e - focusout-event
   * @return {boolean} result
   */
  _isFocusOnDropArea(e) {
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
        this.currentDragParams.draggedItem.selected = true;

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

        if (!this.isDragStart) {
          this.emit(this.constructor.EVENTS.DRAG_START, e, item);
        } else {
          delete this.isDragStart;
        }

        this.emit(this.constructor.EVENTS.DRAG_ITEM_SELECT, e, {
          dnd: this,
          dragItem: item,
          chosenDraggedItem: this.currentDragParams.chosenDraggedItem,
          dropAreas: this.dropAreas,
          allowedDropAreas: this.allowedDropAreas
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
        dnd: this,
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

        dragItem.placeToDropArea({ dropArea: chosenDropArea });
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

  // TODO: see there (for replacing or wrong dragging announce)
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
    const { dragItem, dropArea, isSameDropArea, _shiftRemainingItems, replacedDragItem } = params;

    const forUserArgs = {
      dragItem,
      dropArea,
      remainingDragItems: this.remainingDragItems,
      replacedDragItem,
      isSameDropArea: false,
      isReset: false
    };

    if (isSameDropArea) {
      forUserArgs.isSameDropArea = true;

      this._finishDrag(forUserArgs);

      return;
    }

    if (this._isNeedToReplace(dropArea)) {
      dropArea.innerDragItems[0].replaceBy(dragItem);

      return;
    }

    if (this._isNeedToReset(dragItem, dropArea)) {
      forUserArgs.isReset = true;

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
      this._updateElementSiblings(element, this.remainingDragItems, this.firstRemainingDragItem, (item) => {
        this.firstRemainingDragItem = item;
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
    this.firstRemainingDragItem = elementsArray[0];
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
        if (item.isNeedForShiftTo(this._initialDragItemsCoordinates[index])) {
          item.translateTo(this._initialDragItemsCoordinates[index], true, () => item.coordinates.currentStart.update());
        }
      });
    }
  }

  /**
   * Replaces drag items (for only drag items case (without existing drop areas))
   * @param {dragItem} dragItem1
   * @param {dragItem} dragItem2
   * @param {function} userCallback - callback function, which will be executed after animation's end
   * @public
   */
  shuffleDragItems(dragItem1, dragItem2, userCallback) {
    if (dragItem1 && dragItem2 && !dragItem2.disabled) {
      dragItem1.selected = dragItem2.selected = false;
      this.settings.shiftDragItems
        ? this._moveDragItems(dragItem1, dragItem2, userCallback)
        : this._replaceDragItems(dragItem1, dragItem2, userCallback);
    } else {
      dragItem1.reset();
      this._finishDrag({ dragItem1 });
    }
  }

  /**
   * Replace drag items between themselves, when drop areas don't exist
   * @param {object} dragItem1 - first replaced drag item
   * @param {object} dragItem2 - second replaced drag item
   * @param {function} callback - callback function, which will be executed after animation's end
   * @public
   */
  _replaceDragItems(dragItem1, dragItem2, callback) {
    const firstItemStartCoordinates = merge.recursive(true, {}, dragItem1.coordinates.currentStart);
    const secondItemStartCoordinates = merge.recursive(true, {}, dragItem2.coordinates.currentStart);

    utils.replaceArrayItems(this.remainingDragItems, dragItem1, dragItem2);
    this._replaceSiblings(this.remainingDragItems);

    dragItem1.translateTo(secondItemStartCoordinates, true, () => this._updateDragItem(dragItem1, secondItemStartCoordinates));
    dragItem2.translateTo(firstItemStartCoordinates, true, () => {
      this._updateDragItem(dragItem2, firstItemStartCoordinates);

      /**
       * We change DOM-tree for touch devices -> focus will be disappear, so we set it again after DOM updating,
       * if callback is undefined
       */
      callback ? callback(dragItem1, dragItem2) : dragItem1.focus();
    });

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
   * @param {function} callback - callback function, which will be executed after animation's end
   * @public
   */
  _moveDragItems(dragItem, toDragItem, callback) {
    utils.moveArrayItems(this.remainingDragItems, this.remainingDragItems.indexOf(dragItem),
                              this.remainingDragItems.indexOf(toDragItem));

    this._replaceSiblings(this.remainingDragItems);

    if (utils.IS_TOUCH) {
      /**
       * We change DOM-tree for right sequent focus by touch screenreaders, like TalkBack or VoiceOver.
       */
      this._updateAllNodesDOMPositions([...this.dragItems], () => {
        /** Set focus, that screenreader will read element with it's new position, if callback is undefined */
        callback ? callback(dragItem, toDragItem) : dragItem.focus();
      });
    } else {
      this.remainingDragItems.forEach((item) => {
        item.translateTo(this._initialDragItemsCoordinates[item.index], true, () => {
          item.coordinates.currentStart.update();
          /** Set focus, that screenreader will read element with it's new position, if callback is undefined */
          callback ? callback(dragItem, toDragItem) : dragItem.focus();
        });
      });
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
   * @param {function} updatedDOMcallback - callback function, which will be executed after DOM manipulating's end
   * @private
   */
  _updateAllNodesDOMPositions(elemsArray, updatedDOMcallback) {
    /**
     * Sort array to add nodes down up
     */
    elemsArray.sort((elem1, elem2) => elem2.index - elem1.index);

    /**
     * Moves DOM-nodes in first element's animation end callback, that they were updated sequentially.
     * Otherwise, animations will not be ended sequentially and DOM elements will be moved randomize
     */
    elemsArray[0].translateTo(this._initialDragItemsCoordinates[elemsArray[0].index], true, () => {
      elemsArray.forEach((item) => this._updateNodeDOMPosition(item, this._initialDragItemsCoordinates[item.index]));
      updatedDOMcallback();
    });

    for (let i = 1; i < elemsArray.length; i++) {
      elemsArray[i].translateTo(this._initialDragItemsCoordinates[elemsArray[i].index], true);
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

    this._setHiddenAriaContainerFor(this.dragItems);
    this.dropAreas && this._setHiddenAriaContainerFor(this.dropAreas);

    for (const key in this.settings) {
      if (this.settings.hasOwnProperty(key)) {
        this.settings[key] = this._checkSetting(key, this.settings[key]);
      }
    }

    this.tooltip = new Tooltip(this.settings.tooltipParams);

    this.remainingDragItems = [...this.dragItems];
    this.allowedDropAreas = this.dropAreas ? [...this.dropAreas] : null;
    this._initialDragItemsCoordinates = [];
    this.dragItems.forEach((item, index) => {
      this._initialDragItemsCoordinates[index] = merge.recursive(true, {}, item.coordinates.default);
    });
  }

  /**
   * Creates hidden containers for aria descriptions
   * @param {dragItem[]|dropAreas[]} dndElems
   * @private
   */
  _setHiddenAriaContainerFor(dndElems) {
    dndElems.forEach((item) => {
      item.initOwnAriaDescElement(this._hiddenDescContainer);
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
      case 'debouncedResize':
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
       //   This.on(this.constructor.EVENTS_HANDLER_RELATIONS[settingName], settingValue);
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
      case 'itemsOrderReadingParams':
      case 'unselectParams':
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
        verifiedValue = utils.getElement(settingValue) || utils.createHTML({
          html: '<span></span>',
          container: document.documentElement,
          className: 'visually-hidden',
          attrs: {
            'aria-live': 'polite'
          }
        });
        break;
      case 'hotkeyCode':
        if (typeof +settingValue === 'number') {
          verifiedValue = +settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set keyCode number');
        }
        break;
      case 'usageInstruction':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue;

          if (verifiedValue.length && !utils.IS_TOUCH) {
            this.dragItems.forEach((item) => item.setCommonUsageInstruction(verifiedValue));
            this.dropAreas && this.dropAreas.forEach((area) => area.setCommonUsageInstruction(verifiedValue));
          }
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
      case 'a11yTexts':
        verifiedValue = this.checkA11yTexts(settingName, settingValue);
        break;
      default:
        verifiedValue = settingValue;
    }

    return verifiedValue;
  }

  checkA11yTexts(settingName, settingValue) {
    let verifiedValue;

    switch (typeof settingValue) {
      case 'object':
        verifiedValue = {};

        for (const key in settingValue) {
          if (settingValue.hasOwnProperty(key)) {
            verifiedValue[key] = this.checkA11yTexts(key, settingValue[key]);
          }
        }
        break;
      case 'string':
      case 'function':
        verifiedValue = settingValue;
        break;
      default:
        utils.showSettingError(settingName, settingValue, 'Please set string or function, which returns a string');

        verifiedValue = '';
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

    this._hiddenDescContainer = utils.createHTML({
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
      const { draggedItem } = this.currentDragParams;

      if (draggedItem.ariaGrabbed !== '') {
        /**
         * If current attribute's value === '', then this attribute doesn't need to set
         */
        draggedItem.ariaGrabbed = false;
      }
      draggedItem.selected = false;
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

    this.firstRemainingDragItem.tabIndex = 0;
    this.firstAllowedDropArea.tabIndex = areDroppedItemsPossibleToReplace ? 0 : -1;
  }

  /**
   * Removes all events emitters and handlers
   * @public
   */
  destroy() {
    this._removeEventsHandlers(this.constructor.EVENTS);
    this._removeEventsHandlers(DragItem.EVENTS);

    this.dragItems.forEach((item) => item.handler.removeEventListener(this._deviceEvents.dragStart, item.onMouseDownHandler));
    this._removeStandardEventsHandlers(this.dragItems);
    this.dropAreas && this._removeStandardEventsHandlers(this.dropAreas);

    window.removeEventListener(this.constructor.STANDARD_EVENTS.RESIZE, this._onResizeHandler);
    this.container.removeEventListener(this.constructor.STANDARD_EVENTS.KEYDOWN, this._onAppKeyDownHandler);
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
        coordinates: this._initialDragItemsCoordinates[index],
        removedClassName: params.removedClassName,
        afterAnimationCB: () => {
          /**
           * After last item's animation end we change DOM-tree on touch devices (for screenreader right focus order) and call user callback
           */
          if (index === this.dragItems.length - 1) {
            utils.IS_TOUCH && this.dragItems.forEach((item, index) => {
              this._updateNodeDOMPosition(item, merge.recursive(true, {}, this._initialDragItemsCoordinates[index]), true);
            });

            params.afterAnimationCB && params.afterAnimationCB();
          }
        }
      });
    });

    this._resetAllSiblings(this.dragItems);
    this._initSiblings(this.dragItems);
    this.firstRemainingDragItem = this.dragItems[0];
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

    this.firstRemainingDragItem = this.remainingDragItems.length ? this.remainingDragItems[0] : null;
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

  setLiveText(message) {
    const { liveTextElement } = this.settings;

    if (liveTextElement) {
      liveTextElement.innerHTML = '';
      liveTextElement.innerHTML = message;
    }
  }
}

export default CgDnd;
