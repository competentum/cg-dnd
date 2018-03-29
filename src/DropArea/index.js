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
    const sheckingSetting = super._checkSetting(settingName, settingValue);

    switch (settingName) {
      case 'snapAlignParams':
        if (typeof sheckingSetting === 'object') {
          for (const key in sheckingSetting) {
            if (sheckingSetting.hasOwnProperty(key)) {
              sheckingSetting[key] = this._checkSetting(key, sheckingSetting[key]);
            }
          }

          verifiedValue = sheckingSetting;
        } else {
          localUtils.showSettingError(settingName, sheckingSetting, 'Please set object of align params.');
        }
        break;
      case 'verticalAlign':
        if (typeof sheckingSetting === 'string') {
          verifiedValue = this.constructor.DROP_AREAS_VERTICAL_ALIGN_KINDS.indexOf(sheckingSetting.toLowerCase()) !== -1
            ? sheckingSetting
            : 'top';
        } else {
          localUtils.showSettingError(settingName, sheckingSetting, 'Please set string "top, center or bottom".');
        }
        break;
      case 'horizontalAlign':
        if (typeof sheckingSetting === 'string') {
          verifiedValue = this.constructor.DROP_AREAS_HORIZONTAL_ALIGN_KINDS.indexOf(sheckingSetting.toLowerCase()) !== -1
            ? sheckingSetting
            : 'left';
        } else {
          localUtils.showSettingError(settingName, sheckingSetting, 'Please set string "left, center or right".');
        }
        break;
      default:
        verifiedValue = sheckingSetting;
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

  excludeDragItem(dragItem, withShift = true) {
    const existingItemIndex = this.innerDragItems.indexOf(dragItem);

    if (existingItemIndex !== -1) {
      this.innerDragItems.splice(existingItemIndex, 1);
      this.innerDragItemsCount--;
      dragItem.chosenDropArea = null;

      if (existingItemIndex !== this.innerDragItems.length && withShift) {
        this.shiftRemainingDragItems(existingItemIndex, dragItem);
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

  getHorizontalAlignedCoordinates() {
    return {
      left: () => this.coordinates.default.left,
      center: (dragItem) => this.coordinates.default.left + (this.coordinates.default.width - dragItem.coordinates.default.width) / 2,
      right: (dragItem) => this.coordinates.default.left + (this.coordinates.default.width - dragItem.coordinates.default.width)
    };
  }

  getVerticalAlignedCoordinates() {
    const innerDragItemsLength = this.innerDragItems.length;
    const shiftY = innerDragItemsLength
      ? this.innerDragItems[innerDragItemsLength - 1].coordinates.current.bottom
      : this.coordinates.default.top;

    return {
      top: () => shiftY,
      center: (dragItem) => this.coordinates.default.top + (this.coordinates.default.height - dragItem.coordinates.default.height) / 2,
      bottom: (dragItem) => this.coordinates.default.top + (this.coordinates.default.height - dragItem.coordinates.default.height)
    };
  }

  getAlignedCoords(dragItem) {
    return {
      left: this.getHorizontalAlignedCoordinates()[this.snapAlignParams.horizontalAlign](dragItem),
      top: this.getVerticalAlignedCoordinates()[this.snapAlignParams.verticalAlign](dragItem)
    };
  }

  shiftRemainingDragItems(fromIndex, draggedOutItem) {
    for (let i = fromIndex; i < this.innerDragItems.length; i++) {
      const shiftCoords = {
        left: this.innerDragItems[i].coordinates.current.left,
        top: this.innerDragItems[i].coordinates.current.top - draggedOutItem.coordinates.current.height
      };

      this.innerDragItems[i].translateTo(shiftCoords, true);
    }
  }
}

export default DropArea;
