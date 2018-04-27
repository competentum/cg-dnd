import utils from '../utils';
import DefaultDndElement from '../DefaultDnDElement';

/**
 * @typedef {Object} DropAreaSettings
 * @property {Element} node - html-node of dnd element.
 * @property {*} data - unique data for checking
 * @property {string} - ariaLabel
 * @property {string} - css class name selector
 * @property {string[]} accept - if not empty, drop area will accept only those drag items, which have a same groups
 * @property {dragItem[]} innerDragItems - drag items, which were dropped at this drop area
 * @property {number} innerDragItemsCount - dropped in item's count
 * @property {string|boolean} ariaHidden
 */

/**
 * Accessible drop area Component
 */
class DropArea extends DefaultDndElement {
  /**
   *DropAreas's customizing settings
   * @type {DropAreaSettings}
   */
  static get DEFAULT_SETTINGS() {
    if (!this._DEFAULT_SETTINGS) {
      this._DEFAULT_SETTINGS = {
        node: '',
        data: null,
        ariaLabel: '',
        className: '',
        accept: [],
        innerDragItems: [],
        innerDragItemsCount: 0,
        _ariaHidden: true
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  /**
   * @return {string[]} vertical align settings for inner drag items
   */
  static get DROP_AREAS_VERTICAL_ALIGN_KINDS() {
    if (!this._dropAreasVerticalAlignKinds) {
      this._dropAreasVerticalAlignKinds = ['top', 'center', 'bottom'];
    }

    return this._dropAreasVerticalAlignKinds;
  }

  /**
   * @return {string[]} horizontal align settings for inner drag items
   */
  static get DROP_AREAS_HORIZONTAL_ALIGN_KINDS() {
    if (!this._dropAreasHorizontallAlignKinds) {
      this._dropAreasHorizontallAlignKinds = ['left', 'center', 'right'];
    }

    return this._dropAreasHorizontallAlignKinds;
  }

  static get DND_ELEM_KIND() {
    return 'drop-area';
  }

  /**
   * Set 'move' value for this aria-attribute, if it can accepts dragged item at this moment.
   * Removes this aria-attribute after dragging stop
   * @param {string} value
   */
  set ariaDropEffect(value) {
    if (value) {
      this.node.setAttribute('aria-dropeffect', value);
    } else {
      this.node.removeAttribute('aria-dropeffect');
    }
  }

  /**
   * @return {string} current value
   */
  get ariaDropEffect() {
    if (!this._ariaDropEffect) {
      this._ariaDropEffect = 'none';
    }

    return this._ariaDropEffect;
  }

  /**
   * Flag for tablet's screenreader focus for drag items were dropped inside drop area
   * @param {boolean} flag
   */
  set hasTabletsAccessForInnerDragItems(flag) {
    this._hasTabletsAccessForInnerDragItems = flag;
  }

  /**
   * @return {boolean} tablet's focus flag for drop area's inner drag items
   */
  get hasTabletsAccessForInnerDragItems() {
    if (this._hasTabletsAccessForInnerDragItems === undefined) {
      this._hasTabletsAccessForInnerDragItems = false;
    }

    return this._hasTabletsAccessForInnerDragItems;
  }

  constructor(settings) {
    super(settings);

    this.ariaHidden = true;
  }

  _checkSetting(settingName, settingValue) {
    let verifiedValue;
    const checkingSetting = super._checkSetting(settingName, settingValue);

    switch (settingName) {
      case 'maxItemsInDropArea':
        verifiedValue = +settingValue;

        if (isNaN(verifiedValue) || verifiedValue < 0) {
          utils.showSettingError(settingName, settingValue, 'Please set positive number or 0');
        }
        break;
      case 'snapAlignParams':
        if (typeof checkingSetting === 'object') {
          for (const key in checkingSetting) {
            if (checkingSetting.hasOwnProperty(key)) {
              checkingSetting[key] = this._checkSetting(key, checkingSetting[key]);
            }
          }

          verifiedValue = checkingSetting;
        } else {
          utils.showSettingError(settingName, checkingSetting, 'Please set object of align params.');
        }
        break;
      case 'verticalAlign':
        if (typeof checkingSetting === 'string') {
          verifiedValue = this.constructor.DROP_AREAS_VERTICAL_ALIGN_KINDS.indexOf(checkingSetting.toLowerCase()) !== -1
            ? checkingSetting
            : 'top';
        } else {
          utils.showSettingError(settingName, checkingSetting, 'Please set string "top, center or bottom".');
        }
        break;
      case 'horizontalAlign':
        if (typeof checkingSetting === 'string') {
          verifiedValue = this.constructor.DROP_AREAS_HORIZONTAL_ALIGN_KINDS.indexOf(checkingSetting.toLowerCase()) !== -1
            ? checkingSetting
            : 'left';
        } else {
          utils.showSettingError(settingName, checkingSetting, 'Please set string "left, center or right".');
        }
        break;
      case 'withShift':
      case 'withDroppedItemCSSMargins':
      case 'snap':
        verifiedValue = utils.checkOnBoolean(checkingSetting);

        if (verifiedValue === null) {
          utils.showSettingError(settingName, checkingSetting, 'Please set true or false.');
        }
        break;
      case 'eachDroppedItemIndents':
        if (Array.isArray(checkingSetting)) {
          const RIGHT_ARRAY_LENGTH = 4;
          const initIndentArray = [null, null, null, null];
          const checkedIndentArray = [...checkingSetting, ...initIndentArray];

          if (checkedIndentArray.length > RIGHT_ARRAY_LENGTH) {
            checkedIndentArray.splice(RIGHT_ARRAY_LENGTH, checkedIndentArray.length - RIGHT_ARRAY_LENGTH);
          }

          const marker = utils.findIndex(checkedIndentArray, (item) => item === null);

          if (marker !== -1) {
            const ZERO = 0;
            const ONE = 1;
            const TWO = 2;
            const THREE = 3;

            switch (marker) {
              case ZERO:
              default:
                verifiedValue = [...utils.fillArray(checkedIndentArray, 0)];
                break;
              case ONE:
                verifiedValue = [...utils.fillArray(checkedIndentArray, checkedIndentArray[0])];
                break;
              case TWO:
                verifiedValue = [checkedIndentArray[0], checkedIndentArray[1], checkedIndentArray[0], checkedIndentArray[1]];
                break;
              case THREE:
                verifiedValue = [checkedIndentArray[0], checkedIndentArray[1], checkedIndentArray[2], checkedIndentArray[1]];
                break;
            }
          } else {
            verifiedValue = [...checkedIndentArray];
          }
        } else {
          utils.showSettingError(settingName, checkingSetting, 'Please set indents array like [top, right, bottom, left].');
        }
        break;
      default:
        verifiedValue = checkingSetting;
    }

    return verifiedValue;
  }

  /**
   * Place drag item to drop area
   * @param {dragItem} dragItem
   */
  includeDragItem(dragItem) {
    if (this.innerDragItems.indexOf(dragItem) === -1) {
      this.innerDragItems.push(dragItem);
      this.innerDragItemsCount++;
      dragItem.chosenDropArea = this;
      dragItem.ariaHidden = true;
    }
  }

  /**
   * Remove drag item from drop area
   * @param {dragItem} dragItem
   */
  excludeDragItem(dragItem) {
    const existingItemIndex = this.innerDragItems.indexOf(dragItem);

    if (existingItemIndex !== -1) {
      this.innerDragItems.splice(existingItemIndex, 1);
      this.innerDragItemsCount--;
      dragItem.chosenDropArea = dragItem.chosenDropArea === this ? null : dragItem.chosenDropArea;

      if (this._isNeedForShift(existingItemIndex, this.innerDragItems.length)) {
        this.shiftRemainingDroppedItems(existingItemIndex, dragItem, this.snapAlignParams.verticalAlign);
      }
    }
  }

  /**
   * Checks for shift inner drag items, if it will be needed. If this setting was enabled and excluded drag item wasn't been last
   * or vertical align equals 'center', we shift needed remaining inner drag items in drop area
   * @param {number} excludedItemIndex - innerDragItems's array index of excluded item
   * @param {number} updatedLength - innerDragItems's array length, after item excluding
   * @return {boolean} flag
   * @private
   */
  _isNeedForShift(excludedItemIndex, updatedLength) {
    return this.snapAlignParams.withShift && (excludedItemIndex !== updatedLength || this.snapAlignParams.verticalAlign === 'center');
  }

  checkAccept(dragItem) {
    if (!this.accept.length) {
      return true;
    }

    return utils.findIndex(dragItem.groups, (item) => utils.includes(this.accept, item)) > -1;
  }

  /**
   * Give functions for new dropped item horizontal aligning
   * @param {dragItem} dragItem
   * @param {{top: number, left: number, right: number, bottom: number}} itemIndents - drag item css-margins, if this setting was set,
   *                                                                      otherwise all properties equals '0'
   * @return {{left: (function(): number), center: (function(): number), right: (function(): number)}} callbacks, which calculate aligned
   * horizontal coordinates for dropped item depending on the type of alignment
   * @private
   */
  _getHorizontalAlignedCoordinates(dragItem, itemIndents) {
    return {
      left: () => this.coordinates.default.left + itemIndents.left,
      center: () => this.coordinates.default.left + (this.coordinates.default.width - dragItem.coordinates.default.width) / 2,
      right: () => this.coordinates.default.right - dragItem.coordinates.default.width - itemIndents.right
    };
  }

  /**
   * Give functions for new dropped item vertical aligning
   * @param {dragItem} dragItem
   * @param {{top: number, left: number, right: number, bottom: number}} itemIndents - drag item css-margins, if this setting was set,
   *                                                                      otherwise all properties equals '0'
   * @return {{left: (function(): number), center: (function(): number), right: (function(): number)}} callbacks, which calculate aligned
   * vertical coordinates for dropped item depending on the type of alignment
   * @private
   */
  _getVerticalAlignedCoordinates(dragItem, itemIndents) {
    const innerDragItemsLength = this.innerDragItems.length;
    const lastDragItemCoordinates = innerDragItemsLength && this.maxItemsInDropArea !== 1
      ? this.innerDragItems[innerDragItemsLength - 1].coordinates.current
      : null;

    if (lastDragItemCoordinates && this.snapAlignParams.withShift) {
      return {
        top: () => lastDragItemCoordinates.bottom + itemIndents.top,
        bottom: () => lastDragItemCoordinates.top - dragItem.coordinates.current.height - itemIndents.bottom,
        center: () => {
          const yShift = this.shiftRemainingDroppedItems(0, dragItem, 'center');

          return lastDragItemCoordinates.bottom + yShift + itemIndents.top;
        }
      };
    }

    return {
      top: () => this.coordinates.default.top + itemIndents.top,
      bottom: () => this.coordinates.default.bottom - dragItem.coordinates.default.height - itemIndents.bottom,
      center: () => this.coordinates.default.top + (this.coordinates.default.height - dragItem.coordinates.default.height) / 2
    };
  }

  /**
   * Give aligned coordinates for new dropped item, or its current coordinates, if 'snap'-setting are equals 'false'
   * @param {dragItem} dragItem
   * @return {{left: number, top: number}} coordinates
   * @public
   */
  getAlignedCoords(dragItem) {
    if (!this.snap && this._isVisuallyMoved(dragItem)) {
      return {
        left: dragItem.coordinates.current.left,
        top: dragItem.coordinates.current.top
      };
    }
    this.coordinates.default.update();

    const dragItemIndents = this._getDragItemIndents(dragItem);

    return {
      left: this._getHorizontalAlignedCoordinates(dragItem, dragItemIndents)[this.snapAlignParams.horizontalAlign](),
      top: this._getVerticalAlignedCoordinates(dragItem, dragItemIndents)[this.snapAlignParams.verticalAlign]()
    };
  }

  /**
   * Checks, is item changed his position by dragging (needs for right keyboard access, when 'snap'-setting equals 'false')
   * @param {dragItem} dragItem
   * @return {boolean} flag
   * @private
   */
  _isVisuallyMoved(dragItem) {
    const coords = dragItem.coordinates;

    return coords.current.left !== coords.currentStart.left && coords.current.top !== coords.currentStart.top;
  }

  /**
   * Shift remaining drop area's inner drag items depending on the type of alignment
   * @param {number} fromIndex - index of item, since which needs to shift other dropped items
   * @param {dragItem} dragItem - excluded or included drag item
   * @param {string} [aligningKind='top']
   * @return {number} - vertical shift value
   */
  shiftRemainingDroppedItems(fromIndex, dragItem, aligningKind = 'top') {
    let shiftY;
    const itemIndents = this._getDragItemIndents(dragItem);

    switch (aligningKind) {
      case 'bottom':
        shiftY = dragItem.coordinates.current.height + itemIndents.bottom;
        break;
      case 'center':
        shiftY = -1 * (dragItem.coordinates.current.height + itemIndents.bottom) / 2;
        break;
      case 'top':
      default:
        shiftY = -1 * (dragItem.coordinates.current.height + itemIndents.top);
        break;
    }

    for (let i = fromIndex; i < this.innerDragItems.length; i++) {
      const droppedItem = this.innerDragItems[i];

      droppedItem.translateTo(this._getShiftedCoordinates(droppedItem, shiftY), true, () => droppedItem.coordinates.droppedIn.update());
    }

    if (aligningKind === 'center' && fromIndex) {
      for (let i = 0; i < fromIndex; i++) {
        const droppedItem = this.innerDragItems[i];

        droppedItem.translateTo(this._getShiftedCoordinates(droppedItem, -shiftY), true, () => droppedItem.coordinates.droppedIn.update());
      }
    }

    return shiftY;
  }

  /**
   * Give vertical shifted coordinates for item. (For beautiful above translateTo-method calling)
   * @param {dragItem} droppedItem
   * @param {number} yShift
   * @return {{left: number, top: number}} coordinate's object
   * @private
   */
  _getShiftedCoordinates(droppedItem, yShift) {
    return {
      left: droppedItem.coordinates.current.left,
      top: droppedItem.coordinates.current.top + yShift
    };
  }

  /**
   * Give item's css-margins values (if 'withDroppedItemCSSMargins'-setting was enabled) with indents, which were set by user.
   * @param {dragItem} dragItem
   * @return {{top: number, right: number, bottom: number, left: number}} indents coordinate's object
   * @private
   */
  _getDragItemIndents(dragItem) {
    const defaultMargins = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    const itemMargins = this.snapAlignParams.withDroppedItemCSSMargins ? dragItem.margins : defaultMargins;

    return {
      top: this.snapAlignParams.eachDroppedItemIndents[0] + itemMargins.top,
      right: this.snapAlignParams.eachDroppedItemIndents[1] + itemMargins.right,
      bottom: this.snapAlignParams.eachDroppedItemIndents[2] + itemMargins.bottom,
      left: this.snapAlignParams.eachDroppedItemIndents[3] + itemMargins.left
    };
  }

  /**
   * Reset all inner dropped items
   * @param {object} params - additional parameters
   */
  resetInnerDragItems(params) {
    if (this.innerDragItems.length) {
      while (this.innerDragItems.length) {
        this.innerDragItems[0].reset(params);
      }
    }

    this.currentKeyboardDesc = this.initAriaKeyboardAccessDesc;
    this.currentAriaState = this.initAriaElementDesc;
  }

  /**
   * Reset only incorrect inner dropped items
   */
  resetIncorrectDragItems() {
    if (this.innerDragItems.length) {
      const incorrectItems = [];

      this.innerDragItems.forEach((dragItem) => {
        if (!dragItem.correct) {
          incorrectItems.push(dragItem);
        }
      });

      incorrectItems.forEach((item) => item.reset());

      if (!this.innerDragItems.length) {
        this.currentKeyboardDesc = this.initAriaKeyboardAccessDesc;
        this.currentAriaState = this.initAriaElementDesc;
      }
    }
  }

  /**
   * Change current drop area aria-description
   * @param {function}userCB - user callback, that returns new description
   */
  changeCurrentAriaState(userCB) {
    this.currentAriaState = userCB({
      area: this,
      innerDragItems: this.innerDragItems,
      innerDragItemsCount: this.innerDragItemsCount
    });
  }

  allowKeyboardAccess(flag) {
    if (flag) {
      this.tabIndex = 0;
    }
  }

  /**
   * Makes drop area's inner drag items accessible for tablet's focus
   * @public
   */
  addTabletsAccessForInnerDragItems() {
    if (this.innerDragItemsCount && !this.hasTabletsAccessForInnerDragItems) {
      this.innerDragItems.forEach((dragItem) => {
        dragItem.ariaHidden = false;
      });

      this.hasTabletsAccessForInnerDragItems = true;
    }
  }

  /**
   * Remove tablet's focus access for drop area's inner drag items
   * @public
   */
  removeTabletsAccessForInnerDragItems() {
    if (this.innerDragItemsCount && this.hasTabletsAccessForInnerDragItems) {
      this.innerDragItems.forEach((dragItem) => {
        dragItem.ariaHidden = true;
      });

      this.hasTabletsAccessForInnerDragItems = false;
    }
  }
}

export default DropArea;
