import localUtils from '../utils';
import DefaultDndElement from '../DefaultDnDElement';

/**
 * Accessible drag item Component
 */
class DropArea extends DefaultDndElement {
  /**
   *DragItem's customizing settings
   * @typedef {Object} DragItemSettings
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
        innerDragItemsCount: 0
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  static get DROP_AREAS_VERTICAL_ALIGN_KINDS() {
    if (!this._dropAreasVerticalAlignKinds) {
      this._dropAreasVerticalAlignKinds = ['top', 'center', 'bottom'];
    }

    return this._dropAreasVerticalAlignKinds;
  }

  static get DROP_AREAS_HORIZONTAL_ALIGN_KINDS() {
    if (!this._dropAreasHorizontallAlignKinds) {
      this._dropAreasHorizontallAlignKinds = ['left', 'center', 'right'];
    }

    return this._dropAreasHorizontallAlignKinds;
  }

  _checkSetting(settingName, settingValue) {
    let verifiedValue;
    const checkingSetting = super._checkSetting(settingName, settingValue);

    switch (settingName) {
      case 'snapAlignParams':
        if (typeof checkingSetting === 'object') {
          for (const key in checkingSetting) {
            if (checkingSetting.hasOwnProperty(key)) {
              checkingSetting[key] = this._checkSetting(key, checkingSetting[key]);
            }
          }

          verifiedValue = checkingSetting;
        } else {
          localUtils.showSettingError(settingName, checkingSetting, 'Please set object of align params.');
        }
        break;
      case 'verticalAlign':
        if (typeof checkingSetting === 'string') {
          verifiedValue = this.constructor.DROP_AREAS_VERTICAL_ALIGN_KINDS.indexOf(checkingSetting.toLowerCase()) !== -1
            ? checkingSetting
            : 'top';
        } else {
          localUtils.showSettingError(settingName, checkingSetting, 'Please set string "top, center or bottom".');
        }
        break;
      case 'horizontalAlign':
        if (typeof checkingSetting === 'string') {
          verifiedValue = this.constructor.DROP_AREAS_HORIZONTAL_ALIGN_KINDS.indexOf(checkingSetting.toLowerCase()) !== -1
            ? checkingSetting
            : 'left';
        } else {
          localUtils.showSettingError(settingName, checkingSetting, 'Please set string "left, center or right".');
        }
        break;
      case 'withShift':
      case 'withDroppedItemCSSMargins':
        verifiedValue = localUtils.checkOnBoolean(checkingSetting);

        if (verifiedValue === null) {
          localUtils.showSettingError(settingName, checkingSetting, 'Please set true or false.');
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

          const marker = checkedIndentArray.findIndex((item) => item === null);

          if (marker !== -1) {
            const ZERO = 0;
            const ONE = 1;
            const TWO = 2;
            const THREE = 3;

            switch (marker) {
              case ZERO:
              default:
                verifiedValue = [...checkedIndentArray.fill(0)];
                break;
              case ONE:
                verifiedValue = [...checkedIndentArray.fill(checkedIndentArray[0])];
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
          localUtils.showSettingError(settingName, checkingSetting, 'Please set indents array like [top, right, bottom, left].');
        }
        break;
      default:
        verifiedValue = checkingSetting;
    }

    return verifiedValue;
  }

  includeDragItem(dragItem) {
    const existingItemIndex = this.innerDragItems.indexOf(dragItem);

    if (existingItemIndex === -1) {
      this.innerDragItems.push(dragItem);
      this.innerDragItemsCount++;
      dragItem.chosenDropArea = this;
    }
  }

  excludeDragItem(dragItem) {
    const existingItemIndex = this.innerDragItems.indexOf(dragItem);

    if (existingItemIndex !== -1) {
      this.innerDragItems.splice(existingItemIndex, 1);
      this.innerDragItemsCount--;
      dragItem.chosenDropArea = null;

      if (this.snapAlignParams.withShift
          && (existingItemIndex !== this.innerDragItems.length || this.snapAlignParams.verticalAlign === 'center')) {
        this.shiftRemainingDroppedItems(existingItemIndex, dragItem, this.snapAlignParams.verticalAlign);
      }
    }
  }

  checkAccept(dragItem) {
    if (!this.accept.length) {
      return true;
    }

    for (let i = 0; i < dragItem.groups.length; i++) {
      if (this.accept.includes(dragItem.groups[i])) {
        return true;
      }
    }

    return false;
  }

  getHorizontalAlignedCoordinates(dragItem) {
    const itemIndents = this._getDragItemIndents(dragItem);

    return {
      left: () => this.coordinates.default.left + itemIndents.left,
      center: () => this.coordinates.default.left + (this.coordinates.default.width - dragItem.coordinates.default.width) / 2,
      right: () => this.coordinates.default.right - dragItem.coordinates.default.width - itemIndents.right
    };
  }

  getVerticalAlignedCoordinates(dragItem) {
    const itemIndents = this._getDragItemIndents(dragItem);
    const innerDragItemsLength = this.innerDragItems.length;
    const lastDragItemCoordinates = innerDragItemsLength ? this.innerDragItems[innerDragItemsLength - 1].coordinates.current : null;

    if (lastDragItemCoordinates && this.snapAlignParams.withShift) {
      return {
        top: () => lastDragItemCoordinates.bottom + itemIndents.top,
        bottom: () => lastDragItemCoordinates.top - dragItem.coordinates.current.height - itemIndents.bottom,
        center: () => {
          this.shiftRemainingDroppedItems(0, dragItem, 'center');

          return lastDragItemCoordinates.bottom + itemIndents.top;
        }
      };
    }

    return {
      top: () => this.coordinates.default.top + itemIndents.top,
      bottom: () => this.coordinates.default.bottom - dragItem.coordinates.default.height - itemIndents.bottom,
      center: () => this.coordinates.default.top + (this.coordinates.default.height - dragItem.coordinates.default.height) / 2
    };
  }

  getAlignedCoords(dragItem) {
    return {
      left: this.getHorizontalAlignedCoordinates(dragItem)[this.snapAlignParams.horizontalAlign](),
      top: this.getVerticalAlignedCoordinates(dragItem)[this.snapAlignParams.verticalAlign]()
    };
  }

  shiftRemainingDroppedItems(fromIndex, draggedOutItem, aligningKind = 'top') {
    let shiftY;
    const itemIndents = this._getDragItemIndents(draggedOutItem);

    switch (aligningKind) {
      case 'bottom':
        shiftY = draggedOutItem.coordinates.current.height + itemIndents.bottom;
        break;
      case 'center':
        shiftY = -1 * (draggedOutItem.coordinates.current.height + itemIndents.bottom) / 2;
        break;
      case 'top':
      default:
        shiftY = -1 * (draggedOutItem.coordinates.current.height + itemIndents.top);
        break;
    }

    for (let i = fromIndex; i < this.innerDragItems.length; i++) {
      this.innerDragItems[i].translateTo({
        left: this.innerDragItems[i].coordinates.current.left,
        top: this.innerDragItems[i].coordinates.current.top + shiftY
      }, true);
    }

    if (aligningKind === 'center' && fromIndex) {
      for (let i = 0; i < fromIndex; i++) {
        this.innerDragItems[i].translateTo({
          left: this.innerDragItems[i].coordinates.current.left,
          top: this.innerDragItems[i].coordinates.current.top - shiftY
        }, true);
      }
    }
  }

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
}

export default DropArea;
