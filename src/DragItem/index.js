import merge from 'merge';
import utils from '../utils';
import cgUtils from 'cg-component-utils';
import DefaultDndElement from '../DefaultDnDElement';

/**
 * @typedef {Object} DragItemSettings
 * @property {Element} node - html-node of dnd element.
 * @property {*} data - unique data for checking
 * @property {string} - ariaLabel
 * @property {string} - css class name selector
 * @property {string[]} groups - groups names array for drop areas, which accepts only special drag items
 * @property {string|Element} handler - html-element for start dragging by mouse/touch.
 * @property {string|boolean} _ariaGrabbed - aria-attribute. It will be set 'true', when start dragging
 * @property {string|boolean} ariaHidden
 */

/**
 * Accessible drag item Component
 */
class DragItem extends DefaultDndElement {
  /**
   *DragItem's customizing settings
   * @type {DragItemSettings}
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

  /**
   * @return {{DRAG_ITEM_RESET: string, ATTEMPT_TO_PUT_DRAG_ITEM: string}} events, which are emitted to CgDnD-object
   * @constructor
   */
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

  /**
   * User sets this value for own drag item
   * @param {boolean} value
   */
  set correct(value) {
    this._correct = utils.checkOnBoolean(value);
  }

  /**
   * @return {boolean} current correct/incorrect value
   */
  get correct() {
    if (!this._correct) {
      this._correct = false;
    }

    return this._correct;
  }

  /**
   * @return {boolean} aria-grabbed current value
   */
  get ariaGrabbed() {
    if (!this._ariaGrabbed) {
      this._ariaGrabbed = false;
    }

    return this._ariaGrabbed;
  }

  /**
   * Set this aria-attribute in 'true', when drag item is dragged, set in 'false', when dragging was stopped
   * @param {boolean} value
   */
  set ariaGrabbed(value) {
    this._ariaGrabbed = value;

    this.node.setAttribute('aria-grabbed', value);
  }

  _checkSetting(settingName, settingValue) {
    let verifiedValue;
    const sheckingSetting = super._checkSetting(settingName, settingValue);

    switch (settingName) {
      case 'handler':
        if (typeof sheckingSetting === 'string') {
          verifiedValue = utils.getElement(sheckingSetting, this.node) || this.node;
        } else {
          utils.showSettingError(settingName, sheckingSetting, 'Please set class selector or empty string.');
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
          utils.showSettingError(settingName, settingValue, 'Please set object of css animataion settings.');
        }
        break;
      case 'delay':
      case 'duration':
        verifiedValue = +settingValue;

        if (!verifiedValue && verifiedValue !== 0 || isNaN(verifiedValue)) {
          utils.showSettingError(settingName, settingValue, `Please set number for animation ${settingName} value in ms`);
        }
        break;
      case 'animatedProperty':
      case 'timingFunction':
        if (typeof settingValue === 'string' && settingValue.length) {
          verifiedValue = settingValue;
        } else {
          utils.showSettingError(settingName, settingValue, `Please string of ${settingName}.`);
        }
        break;
      default:
        verifiedValue = sheckingSetting;
    }

    return verifiedValue;
  }

  /**
   * Moves drag item element to (x, y) coordinates by css-transform: translate with/without animation
   * @param {object} coords - object of 'left' 'top' node's coordinates
   * @param {boolean} isAnimate - animate flag
   * @param {function} animationEndCallback - callback, which will called after animation's end
   * @param {object} animateParams - params for css-transition
   * @public
   */
  translateTo(coords, isAnimate, animationEndCallback = () => {}, animateParams = {}) {
    const animProps = merge({}, this.animationParams, animateParams);
    const left = coords.left - this.coordinates.default.left;
    const top = coords.top - this.coordinates.default.top;

    cgUtils.addClass(this.node, this.constructor.CSS_CLASS.CURRENT_DRAGGED_ITEM);

    /* If (this.hasTransition()) {
     const currentPosition = getComputedStyle(this.node).transform;

     this.breakTransition();
     this.node.style.transform = currentPosition;
     } */

    if (isAnimate) {
      this.node.style.transition = `${animProps.animatedProperty} ${animProps.duration}ms ${animProps.timingFunction} ${animProps.delay}ms`;

      /**
       * Transitionend event handler for disabling animation, when it was finished
       */
      const transitionEndListener = () => {
        this.node.style.transition = '';
        this.coordinates.current.update();
        this.node.removeEventListener('transitionend', transitionEndListener);
        animationEndCallback();
        cgUtils.removeClass(this.node, this.constructor.CSS_CLASS.CURRENT_DRAGGED_ITEM);
      };

      this.node.addEventListener('transitionend', transitionEndListener);
      this.node.style.transform = `translate(${left}px, ${top}px)`;

      if (!animProps.duration) {
        /**
         * Transitionend event doesn't called, if duration = 0. So we call this handler manually
         */
        transitionEndListener();
      } else {
        /**
         * Sometimes, 'transitionend' event doesn't fired, then we fire it manually
         */
        setTimeout(() => {
          if (this.hasTransition()) {
            this.breakTransition();
          }
        }, animProps.duration);
      }

    } else {
      this.node.style.transform = `translate(${left}px, ${top}px)`;
      this.coordinates.current.update();
      animationEndCallback();
    }
  }

  /**
   * Reset item to default settings
   * @param {{coordinates: object, from: dropArea, removedClassName: string}} params - additional settings for resettable element
   * @public
   */
  reset(params = {}) {
    this.translateTo(params.coordinates || this.coordinates.currentStart, true, () => {
      this.coordinates.currentStart.update();

      if (params.afterAnimationCB) {
        params.afterAnimationCB();
      }
    });
    this.emit(this.constructor.EVENTS.DRAG_ITEM_RESET, this, this.chosenDropArea || params.from);

    if (this.chosenDropArea) {
      this.chosenDropArea.removeDragItem(this);
    }

    if (this.disabled) {
      this.enable();
    }

    if (params.removedClassName) {
      cgUtils.removeClass(this.node, params.removedClassName);
    }

    this.correct = this.ariaHidden = false;

    this.currentKeyboardDesc = this.initAriaKeyboardAccessDesc;
    this.currentAriaState = this.initAriaElementDesc;
  }

  /**
   * Set initial node-coordinates
   * @private
   */
  _getDefaultCoordinates() {
    const initCoordinates = super._getDefaultCoordinates();

    this._createCoordinatesObject('current', initCoordinates);
    this._createCoordinatesObject('currentStart', initCoordinates);
    this._createCoordinatesObject('droppedIn', initCoordinates);
  }

  /**
   * Save node's css-margins for future aligning in dropArea, if it will be needed.
   * @private
   */
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
   * @param {dropArea} chosenDropArea - DropArea object
   * @param {boolean} callCheckAfterAnimationEnd - if "true", checking will be executed after animation end,
   * else it will be executed in this function end
   * @param {function} afterAnimationCB - callback function, which will be executed after animation end
   * @return {boolean} - return "true", if dragItem changes his position, otherwise return "false"
   * @public
   */
  putIntoDropArea(chosenDropArea, callCheckAfterAnimationEnd = false, afterAnimationCB = () => {}) {
    if (this.chosenDropArea && this.chosenDropArea === chosenDropArea) {
      this.translateTo(this.coordinates.droppedIn, true);
      this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea, true);

      return false;
    }

    this.translateTo(chosenDropArea.getAlignedCoords(this), true, () => {
      this.coordinates.droppedIn.update();

      callCheckAfterAnimationEnd && this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea, false);

      afterAnimationCB(this, chosenDropArea);
    });

    !callCheckAfterAnimationEnd && this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, this, chosenDropArea, false);

    return true;
  }

  /**
   * Replace two drag items between themselves
   * @param {dragItem} replacedDragItem - second replaced drag item
   */
  replaceBy(replacedDragItem) {
    const firstItemDropArea = this.chosenDropArea;
    const secondItemDropArea = replacedDragItem.chosenDropArea;

    if (firstItemDropArea) {
      firstItemDropArea.removeDragItem(this);
      replacedDragItem.putIntoDropArea(firstItemDropArea);
    } else {
      replacedDragItem.reset({ from: secondItemDropArea });
    }

    if (secondItemDropArea) {
      secondItemDropArea.removeDragItem(replacedDragItem);
      this.putIntoDropArea(secondItemDropArea);
    } else {
      this.reset({ from: firstItemDropArea });
    }
  }

  /**
   * Checks element current transition presence
   * @return {boolean} transition presence or absence
   * @public
   */
  hasTransition() {
    return this.node.style.transition !== '';
  }

  breakTransition() {
    const event = document.createEvent('Event');

    event.initEvent('transitionend', true, true);
    this.node.dispatchEvent(event);
  }

  /**
   * Set focus, that screenreader will reads description
   * @param {number} [delay=0] - setting focus delay, if it will be needed
   * @public
   */
  focus(delay) {
    if (delay !== undefined) {
      setTimeout(() => this.node.focus(), delay);
    } else if (this.hasTransition()) {
      /**
       * We set focus on element after his animation's end for NVDA + FF (otherwise NVDA reads element description twice)
       */
      const setFocusAfterTransition = () => {
        this.node.focus();
        this.node.removeEventListener('transitionend', setFocusAfterTransition);
      };

      this.node.addEventListener('transitionend', setFocusAfterTransition);
    } else {
      this.node.focus();
    }
  }

  /**
   * Checks, will be drag item needed to update his position during a drag items shifting
   * @param {object} toShiftPosition - new position after shifting
   * @return {boolean} if 'true', it will be needed, otherwise - not needed
   * @public
   */
  isNeedForShiftTo(toShiftPosition) {
    const atCurrentTimeShift = getComputedStyle(this.node).transform.match(/matrix\(.*, (.*)?, (.*)?\)$/i);

    if (atCurrentTimeShift) {
      const currentLeft = this.coordinates.default.left + parseFloat(atCurrentTimeShift[1]);
      const currentTop = this.coordinates.default.top + parseFloat(atCurrentTimeShift[2]);

      return currentLeft !== toShiftPosition.left || currentTop !== toShiftPosition.top;
    }

    return this.coordinates.currentStart.left !== toShiftPosition.left || this.coordinates.currentStart.top !== toShiftPosition.top;
  }

  /**
   * Change current drop area aria-description
   * @param {function}userCB - user callback, that returns new description
   */
  changeCurrentAriaState(userCB) {
    this.currentAriaState = userCB({
      item: this,
      chosenDropArea: this.chosenDropArea
    });
  }
}

export default DragItem;
