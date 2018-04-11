import merge from 'merge';
import localUtils from '../utils';
import cgUtils from 'cg-component-utils';
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
        DRAG_ITEM_RESET: 'reset',
        ATTEMPT_TO_PUT_DRAG_ITEM: 'attemptToPutDragItem'
      };
    }

    return this._EVENTS;
  }

  constructor(settings, dndEmitterFunc) {
    super(settings);

    this._getMargins();
    this.emit = dndEmitterFunc;
  }

  set correct(value) {
    this._correct = localUtils.checkOnBoolean(value);
  }

  get correct() {
    if (!this._correct) {
      this._correct = false;
    }

    return this._correct;
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
    } else if (this.onMouseDownHandler) {
      this.handler.addEventListener('mousedown', this.onMouseDownHandler);
      this.handler.addEventListener('touchstart', this.onMouseDownHandler, { passive: false });
    }
  }

  get disabled() {
    return super.disabled;
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
      case 'animationParams':
        if (typeof settingValue === 'object') {
          for (const key in settingValue) {
            if (settingValue.hasOwnProperty(key)) {
              settingValue[key] = this._checkSetting(key, settingValue[key]);
            }
          }

          verifiedValue = settingValue;
        } else {
          localUtils.showSettingError(settingName, settingValue, 'Please set object of css animataion settings.');
        }
        break;
      case 'delay':
      case 'duration':
        verifiedValue = +settingValue;

        if (!verifiedValue && verifiedValue !== 0 || isNaN(verifiedValue)) {
          localUtils.showSettingError(settingName, settingValue, `Please set number for animation ${settingName} value in ms`);
        }
        break;
      case 'animatedProperty':
      case 'timingFunction':
        if (typeof settingValue === 'string' && settingValue.length) {
          verifiedValue = settingValue;
        } else {
          localUtils.showSettingError(settingName, settingValue, `Please string of ${settingName}.`);
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
   * @param {function} animationEndCallback - callback, which would calls after animation's end
   * @public
   */
  translateTo(coords, isAnimate, animateParams, animationEndCallback = () => {}) {
    const animProps = merge({}, this.animationParams, animateParams);
    const x = coords.left;
    const y = coords.top;
    const left = x - this.coordinates.default.left;
    const top = y - this.coordinates.default.top;

    if (isAnimate) {
      this.node.style.transition = `${animProps.animatedProperty} ${animProps.duration}ms ${animProps.timingFunction} ${animProps.delay}ms`;

      setTimeout(() => {
        this.node.style.transition = '';
        this.coordinates.current.update();

        animationEndCallback();
      }, animProps.duration + animProps.delay);

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
      animationEndCallback();
    }
  }

  reset(params = {}) {
    this.translateTo(params.coordinates || this.coordinates.currentStart, true, {}, () => this.coordinates.currentStart.update());
    this.emit(this.constructor.EVENTS.DRAG_ITEM_RESET, this, this.chosenDropArea || params.from);

    if (this.chosenDropArea) {
      this.chosenDropArea.excludeDragItem(this);
    }

    if (this.disabled) {
      this.enable();
    }

    if (params.removedClassName) {
      cgUtils.removeClass(this.node, params.removedClassName);
    }

    this.correct = false;
  }

  _getDefaultCoordinates() {
    const initCoordinates = super._getDefaultCoordinates();

    this._createCoordinatesObject('current', initCoordinates);
    this._createCoordinatesObject('currentStart', initCoordinates);
    this._createCoordinatesObject('droppedIn', initCoordinates);
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

  /**
   * Try to put drag item to chosen drop area
   * @param {object} chosenDropArea - DropArea object
   * @return {boolean} - return "true", if dragItem change his position, otherwise return "false"
   * @public
   */
  putIntoDropArea(chosenDropArea) {
    if (this.chosenDropArea && this.chosenDropArea === chosenDropArea) {
      this.translateTo(this.coordinates.droppedIn, true);
      this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea, true);

      return false;
    }

    this.translateTo(chosenDropArea.getAlignedCoords(this), true, {}, () => this.coordinates.droppedIn.update());
    this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea);

    return true;
  }

  replaceBy(replacedDragItem) {
    const firstItemDropArea = this.chosenDropArea;
    const secondItemDropArea = replacedDragItem.chosenDropArea;

    if (firstItemDropArea) {
      firstItemDropArea.excludeDragItem(this);
      replacedDragItem.putIntoDropArea(firstItemDropArea);
    } else {
      replacedDragItem.reset({ from: secondItemDropArea });
    }

    if (secondItemDropArea) {
      secondItemDropArea.excludeDragItem(replacedDragItem);
      this.putIntoDropArea({ from: secondItemDropArea });
    } else {
      this.reset(firstItemDropArea);
    }
  }
}

export default DragItem;
