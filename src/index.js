import './common.less';

import EventEmitter from 'events';
import merge from 'merge';
import utils from 'cg-component-utils';

const DND_CLASS = 'cg-dnd';

const CLASS = {
  DND: DND_CLASS,
  DRAG: `${DND_CLASS}-drag-item`
};

const KEY_CODE = {
  ESC: 27,
  TAB: 9
};

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
      };
    }

    return this._EVENTS;
  }

  /**
   * @param {DndSettings} settings - Dnd's settings, all undefined settings will be taken from {@link CgDnd.DEFAULT_SETTINGS}
   * @constructor
   */
  constructor(settings) {
    super();

    this._applySettings(settings);

    this._render();

    this._addListeners();
  }

  /**
   * Add event listeners
   * @private
   */
  _addListeners() {

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
    this.settings = merge({}, this.constructor.DEFAULT_SETTINGS, settings);

  }

  /**
   * Create DOM elements
   * @private
   */
  _render() {

  }

  /**
   * Disable drag
   * @param {boolean} [disabled = true]
   */
  disable(disabled = true) {

  }

  reset() {

  }

  destroy() {

  }
}

export default CgDnd;
