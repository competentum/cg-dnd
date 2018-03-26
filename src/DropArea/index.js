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
        accept: '',
        innerDragItems: [],
        innerDragItemsCount: 0
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  updateDefaultCoordinates() {
    this.coordinates.default = localUtils.getElementPosition(this.node);
  }

  includeDragItem(dragItem) {
    const existingItemIndex = this.innerDragItems.indexOf(dragItem);

    if (existingItemIndex === -1) {
      this.innerDragItems.push(dragItem);
      this.innerDragItemsCount++;
    }
  }

  excludeDragItem(dragItem) {
    const existingItemIndex = this.innerDragItems.indexOf(dragItem);

    if (existingItemIndex !== -1) {
      this.innerDragItems.splice(existingItemIndex, 1);
      this.innerDragItemsCount--;
    }
  }
}

export default DropArea;
