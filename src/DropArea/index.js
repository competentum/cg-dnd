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
        _isEmpty: true
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  updateDefaultCoordinates() {
    this.coordinates.default = localUtils.getElementPosition(this.node);
  }
}

export default DropArea;
