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
        handler: '',
        _ariaGrabbed: false,
        _ariaHidden: false
      };
    }

    return this._DEFAULT_SETTINGS;
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

  static get DND_ELEM_KIND() {
    return 'drag-item';
  }

  static get DND_CLASS() {
    return 'cg-dnd';
  }

  static get CSS_CLASS() {
    return {
      CURRENT_DRAGGED_ITEM: `${this.DND_CLASS}-current-dragged-item`
    };
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

  get ariaGrabbed() {
    if (!this._ariaGrabbed) {
      this._ariaGrabbed = false;
    }

    return this._ariaGrabbed;
  }

  set ariaGrabbed(value) {
    this._ariaGrabbed = this.setSetting('_ariaGrabbed', value);
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
      case '_ariaGrabbed':
        verifiedValue = localUtils.checkOnBoolean(settingValue);

        if (verifiedValue === null) {
          localUtils.showSettingError(settingName, settingValue, 'Please set true or false.');
        }

        this.node.setAttribute('aria-grabbed', settingValue);
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

    cgUtils.addClass(this.node, this.constructor.CSS_CLASS.CURRENT_DRAGGED_ITEM);

    if (isAnimate) {
      this.node.style.transition = `${animProps.animatedProperty} ${animProps.duration}ms ${animProps.timingFunction} ${animProps.delay}ms`;

      /**
       * Transitionend event handler for disabling animation, when it was finished
       */
      const transitionListener = () => {
        this.node.style.transition = '';
        this.coordinates.current.update();


        this.node.removeEventListener('transitionend', transitionListener);
        animationEndCallback();
        cgUtils.removeClass(this.node, this.constructor.CSS_CLASS.CURRENT_DRAGGED_ITEM);
      };

      this.node.addEventListener('transitionend', transitionListener);
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
   * @param {boolean} callCheckAfterAnimationEnd - if "true", checking would been execute after animation end,
   * else it would been execute in this function end
   * @param {function} afterAnimationCB - callback function, which would been execute after animation end
   * @return {boolean} - return "true", if dragItem change his position, otherwise return "false"
   * @public
   */
  putIntoDropArea(chosenDropArea, callCheckAfterAnimationEnd = false, afterAnimationCB = () => {}) {
    if (this.chosenDropArea && this.chosenDropArea === chosenDropArea) {
      this.translateTo(this.coordinates.droppedIn, true);
      this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea, true);

      return false;
    }

    this.translateTo(chosenDropArea.getAlignedCoords(this), true, {}, () => {
      this.coordinates.droppedIn.update();

      callCheckAfterAnimationEnd && this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea, false);

      afterAnimationCB(this, chosenDropArea);
    });
    !callCheckAfterAnimationEnd && this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea, false);

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
      this.putIntoDropArea(secondItemDropArea);
    } else {
      this.reset({ from: firstItemDropArea });
    }
  }
}

export default DragItem;
