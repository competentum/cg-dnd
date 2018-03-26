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
        group: ''
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

  set currentDragStartPosition(coordinatesObj) {
    if (typeof coordinatesObj === 'object') {
      // Const currentPos = merge({}, this.coordinates.currentStart)
    }
  }

  get group() {
    return this._group;
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
    const left = (coords.x || coords.left) - this.coordinates.default.left;
    const top = (coords.y || coords.top) - this.coordinates.default.top;

    if (isAnimate) {
      this.node.style.transition = `${props.animatedProperty} ${props.duration}ms ${props.timingFunction} ${props.delay}ms`;

      setTimeout(() => {
        this.node.style.transition = '';
      }, props.duration + props.delay);
    }

    this.node.style.transform = `translate(${left}px, ${top}px)`;
  }

  updateCurrentCoordinates() {
    this.coordinates.current = localUtils.getElementPosition(this.node);
  }

  updateCurrentStartCoordinates() {
    this.coordinates.currentStart = localUtils.getElementPosition(this.node);
  }

  reset() {
    this.translateTo(this.coordinates.currentStart, true);

    this.constructor.mainDnDEmitter.emit(this.constructor.EVENTS.DRAG_ITEM_RESET, this);
  }
}

export default DragItem;
