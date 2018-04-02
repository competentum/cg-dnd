import merge from 'merge';
import localUtils from '../utils';
import EventEmitter from 'events';
import DefaultDndElement from '../DefaultDnDElement';

/**
 * Accessible drag item Component
 */
class DragItem extends DefaultDndElement {
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
        groups: [],
        handler: ''
      };
    }

    return this._DEFAULT_SETTINGS;
  }

  static get animationParams() {
    if (!this._animationParams) {
      this._animationParams = {
        animatedProperty: 'transform',
        duration: 500,
        timingFunction: 'ease',
        delay: 0
      };
    }

    return this._animationParams;
  }

  static set animationParams(settings) {
    if (typeof settings === 'object') {
      this._animationParams = this._animationParams || {};
      this._animationParams = merge({}, this._animationParams, settings);
    }
  }

  static get EVENTS() {
    if (!this._EVENTS) {
      this._EVENTS = {
        DRAG_ITEM_RESET: 'reset'
      };
    }

    return this._EVENTS;
  }

  static set mainDnDEmitter(emitter) {
    this._dndEmitter = emitter;
  }

  static get mainDnDEmitter() {
    if (!this._dndEmitter) {
      this._dndEmitter = new EventEmitter();
    }

    return this._dndEmitter;
  }

  constructor(settings, dndEmitterFunc) {
    super(settings);

    this._getMargins();
    this.emit = dndEmitterFunc;
  }

  set currentDragStartPosition(coordinatesObj) {
    if (typeof coordinatesObj === 'object') {
      // Const currentPos = merge({}, this.coordinates.currentStart)
    }
  }

  get group() {
    return this._group;
  }

  set isFirstItem(value) {
    this.tabIndex = value ? 0 : -1;

    this._isFirstItem = value;
  }

  get isFirstItem() {
    return this._isFirstItem;
  }

  set disabled(flag) {
    super.disabled = flag;

    if (flag && this.onMouseDownHandler) {
      this.handler.removeEventListener('mousedown', this.onMouseDownHandler);
      this.handler.removeEventListener('touchstart', this.onMouseDownHandler, { passive: false });
      this.onMouseDownHandler = null;
    }
  }

  _checkSetting(settingName, settingValue) {
    let verifiedValue;
    const sheckingSetting = super._checkSetting(settingName, settingValue);

    switch (settingName) {
      case 'handler':
        if (typeof sheckingSetting === 'string') {
          verifiedValue = localUtils.getElement(sheckingSetting, this.node) || this.node;
        } else {
          localUtils.showSettingError(settingName, sheckingSetting, 'Please set class selector or empty string.');
        }
        break;
      default:
        verifiedValue = sheckingSetting;
    }

    return verifiedValue;
  }

  /**
   * Moves drag item element to (x, y) coordinates by transform: translate with/without animation
   * @param {object} coords - object of x/left y/top node's coordinates
   * @param {boolean} isAnimate - animate flag
   * @param {object} animateParams - params for css-transition
   * @public
   */
  translateTo(coords, isAnimate, animateParams) {
    const props = merge({}, this.constructor.animationParams, animateParams);
    const x = (coords.x || coords.left);
    const y = (coords.y || coords.top);
    const left = x - this.coordinates.default.left;
    const top = y - this.coordinates.default.top;

    if (isAnimate) {
      this.node.style.transition = `${props.animatedProperty} ${props.duration}ms ${props.timingFunction} ${props.delay}ms`;

      setTimeout(() => {
        this.node.style.transition = '';
        this.coordinates.current.update();
        this.coordinates.droppedIn.update();
      }, props.duration + props.delay);

      // We update coordinates before animation ends

      this.coordinates.current.update({
        left: x,
        top: y,
        right: x + this.coordinates.current.width,
        bottom: y + this.coordinates.current.height
      });
    }

    this.node.style.transform = `translate(${left}px, ${top}px)`;

    if (!isAnimate) {
      this.coordinates.current.update();
    }
  }

  reset() {
    this.translateTo(this.coordinates.currentStart, true);

    this.emit(this.constructor.EVENTS.DRAG_ITEM_RESET, this);
  }

  _getDefaultCoordinates() {
    const initCoords = super._getDefaultCoordinates();

    this._createCoordinatesObject('current', initCoords);
    this._createCoordinatesObject('currentStart', initCoords);
    this._createCoordinatesObject('droppedIn', initCoords);
  }

  _getMargins() {
    this.cssProperties = getComputedStyle(this.node);

    this.margins = {
      left: parseFloat(this.cssProperties.marginLeft),
      top: parseFloat(this.cssProperties.marginTop),
      right: parseFloat(this.cssProperties.marginRight),
      bottom: parseFloat(this.cssProperties.marginBottom)
    };
  }
}

export default DragItem;
