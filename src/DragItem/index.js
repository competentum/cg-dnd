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

  static get SELECTED_ITEM_LABEL() {
    return 'selected ';
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
   * @return {boolean|string} aria-grabbed current value
   */
  get ariaGrabbed() {
    if (!this._ariaGrabbed && this._ariaGrabbed !== '') {
      this._ariaGrabbed = false;
    }

    return this._ariaGrabbed;
  }

  /**
   * Set this aria-attribute in 'true', when drag item is dragged, set in 'false', when dragging was stopped
   * @param {boolean|string} value
   */
  set ariaGrabbed(value) {
    this._ariaGrabbed = value;

    this.node.setAttribute('aria-grabbed', value);
  }

  set currentKeyboardDesc(text) {
    this._currentKeyboardDesc = `${text} ${this.keyboardDescPostfix}`;
    this.keyboardDescElement.innerHTML = this._currentKeyboardDesc;
  }

  get currentKeyboardDesc() {
    return super.currentKeyboardDesc;
  }

  /**
   * Set hotkey postfix instruction for reading current items order
   * @param {string} value - instruction string
   */
  set keyboardDescPostfix(value) {
    this._keyboardDescPostfix = value;

    /**
     * Update current keyboard aria description with new postfix
     */
    this.currentKeyboardDesc = this.currentKeyboardDesc;
  }

  /**
   * @return {string} current instruction postfix
   */
  get keyboardDescPostfix() {
    if (this._keyboardDescPostfix === undefined) {
      this._keyboardDescPostfix = '';
    }

    return this._keyboardDescPostfix;
  }

  set selected(flag) {
    const selectedLabel = this.constructor.SELECTED_ITEM_LABEL;

    if (flag) {
      const currentAriaLabel = this.ariaLabel;

      this.addClass(this.selectedItemClassName);
      this.ariaLabel = `${selectedLabel}${currentAriaLabel}`;
      this._selected = true;
    } else {
      const selectedRegExp = new RegExp(`^${selectedLabel}`);

      this.removeClass(this.selectedItemClassName);
      this.ariaLabel = this.ariaLabel.replace(selectedRegExp, '');
      this._selected = false;
    }
  }

  get selected() {
    return this._selected;
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
      case 'selectedItemClassName':
        if (typeof settingValue === 'string') {
          verifiedValue = settingValue.replace(/^\./, '');
        } else {
          utils.showSettingError(settingName, settingValue, 'Please set string of class name.');
        }
        break;
      default:
        verifiedValue = sheckingSetting;
    }

    return verifiedValue;
  }

  resetAttributes(attrs) {
    if (attrs.length) {
      const carvedAttrs = {};

      attrs.forEach((attr) => {
        const attrName = Object.keys(attr)[0];
        const attrValue = attr[attrName];

        if (this.hasOwnProperty(`_${attrName}`)) {
          /**
           * Save current attribute's value, or set needed value, if it !== ''
           */
          carvedAttrs[attrName] = attrValue === '' ? this[attrName] : attrValue;

          this.node.setAttribute(attrName.toLowerCase().replace('aria', 'aria-'), attrValue);
        }
      });

      return carvedAttrs;
    }
  }

  returnAttributes(attrs) {
    for (const key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        this[key] = attrs[key];
      }
    }
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
    const CUSTOM_TRANSITION_END_DELAY_TOLERANCE = 100;
    let timeoutId,
      carvedAttributes;

    cgUtils.addClass(this.node, this.constructor.CSS_CLASS.CURRENT_DRAGGED_ITEM);

    /* If (this.hasTransition()) {
     const currentPosition = getComputedStyle(this.node).transform;

     this.breakTransition();
     this.node.style.transform = currentPosition;
     } */

    if (isAnimate) {
      /**
       * NVDA reads animated element twice, then we are removing it' attributes. Below we will set them again after animation's end
       */
      if (utils.IS_FF) {
        carvedAttributes = this.resetAttributes([{ ariaDescribedBy: '' }, { ariaGrabbed: false }, { ariaLabel: '' }]);
      }

      this.node.style.transition = `${animProps.animatedProperty} ${animProps.duration}ms ${animProps.timingFunction} ${animProps.delay}ms`;

      /**
       * Transitionend event handler for disabling animation, when it was finished
       * @param {Object} e - transitionend-event object
       */
      const transitionEndListener = (e) => {
        /**
         * Return carved attributes for NVDA + FF
         */
        if (utils.IS_FF) {
          this.returnAttributes(carvedAttributes);
        }

        timeoutId && clearTimeout(timeoutId);
        this.node.style.transition = '';
        this.coordinates.current.update();
        this.node.removeEventListener('transitionend', transitionEndListener);
        animationEndCallback(e);
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
        timeoutId = setTimeout(() => {
          if (this.hasTransition()) {
            this.breakTransition();
          }
        }, animProps.duration + CUSTOM_TRANSITION_END_DELAY_TOLERANCE);
      }

    } else {
      this.node.style.transform = `translate(${left}px, ${top}px)`;
      this.coordinates.current.update();
      animationEndCallback();
    }
  }

  /**
   * Reset item to default settings
   * @param {Object} params
   * @param {function} params.afterAnimationCB - callback function, which will be executed after animation end
   * @param {dropArea} params.from - drop area, from which drag item will be removed
   * @param {boolean} [params._shiftRemainingItems = true] - if "true", remaining drag items will be aligned
   * (if settings.alignRemainingDragItems === true). It's needed for disabling double remaining drag items shifting during replacing
   * @param {string} params.removedClassName - css class name, which will be removed after item resetting
   * @public
   */
  reset(params = { _shiftRemainingItems: true }) {
    this.translateTo(params.coordinates || this.coordinates.currentStart, true, (e) => {
      /**
       * If animation was broken by user mousedown-event, we don't update current start coordinates
       */
      !e.isAnimationAbortedByUser && this.coordinates.currentStart.update();

      if (params.afterAnimationCB) {
        params.afterAnimationCB();
      }
    });

    this.emit(this.constructor.EVENTS.DRAG_ITEM_RESET, {
      dragItem: this,
      chosenDropArea: this.chosenDropArea || params.from,
      _shiftRemainingItems: params._shiftRemainingItems
    });

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
   * @param {Object} params
   * @param {dropArea} params.dropArea - the chosen drop area, in which we want to put a drag item
   * @param {function} params.afterAnimationCB - callback function, which will be executed after animation end
   * @param {boolean} [params.callCheckAfterAnimationEnd = false] - if "true", checking will be executed after animation end,
   * else it will be executed in this function end
   * @param {boolean} [params._shiftRemainingItems = true] - if "true", remaining drag items will be aligned
   * (if settings.alignRemainingDragItems === true). It's needed for disabling double remaining drag items shifting during replacing
   * @return {boolean} - return "true", if dragItem changes his position, otherwise return "false"
   * @public
   */
  putIntoDropArea(params) {
    const { dropArea, callCheckAfterAnimationEnd = false, afterAnimationCB = () => {}, _shiftRemainingItems = true,
            replacedDragItem } = params;
    const paramsForCheck = {
      dragItem: this,
      dropArea,
      isSameDropArea: true,
      _shiftRemainingItems,
      replacedDragItem
    };

    if (this.chosenDropArea && this.chosenDropArea === dropArea) {
      this.translateTo(this.coordinates.droppedIn, true);
      this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, paramsForCheck);

      return false;
    }

    paramsForCheck.isSameDropArea = false;

    this.translateTo(dropArea.getAlignedCoords(this), true, () => {
      this.coordinates.droppedIn.update();

      callCheckAfterAnimationEnd && this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, paramsForCheck);

      afterAnimationCB(this, dropArea);
    });

    !callCheckAfterAnimationEnd && this.emit(this.constructor.EVENTS.ATTEMPT_TO_PUT_DRAG_ITEM, paramsForCheck);

    return true;
  }

  /**
   * Replace two drag items between themselves
   * @param {dragItem} replaceByDragItem - drag item, which replace current drag item
   */
  replaceBy(replaceByDragItem) {
    const firstItemDropArea = this.chosenDropArea;
    const secondItemDropArea = replaceByDragItem.chosenDropArea;

    /**
     * We don't call remaining items aligning after first item replacing by {_shiftRemainingItems: false}
     */
    if (firstItemDropArea) {
      firstItemDropArea.removeDragItem(this);
      replaceByDragItem.putIntoDropArea({
        dropArea: firstItemDropArea,
        _shiftRemainingItems: false,
        replacedDragItem: this
      });
    } else {
      replaceByDragItem.reset({
        from: secondItemDropArea,
        _shiftRemainingItems: false,
        replacedDragItem: this
      });
    }

    if (secondItemDropArea) {
      secondItemDropArea.removeDragItem(replaceByDragItem);
      this.putIntoDropArea({
        dropArea: secondItemDropArea,
        replacedDragItem: this
      });
    } else {
      this.reset({
        from: firstItemDropArea,
        replacedDragItem: this
      });
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
    event.isAnimationAbortedByUser = true;

    this.node.dispatchEvent(event);
  }

  /**
   * DefaultDnDElement.focus() extension for setting focus after transition end
   * @param {Object} params
   * @param {Number} params.delay - delay on focus setting
   * @param {String} [params.liveText = ''] - text for screenreaders, which will be read first after focus
   * @public
   */
  focus(params = {}) {
    if (params.delay !== undefined) {
      super.focus(params);
    } else if (this.hasTransition()) {
      /**
       * We set focus on element after his animation's end for NVDA + FF (otherwise NVDA reads element description twice)
       */
      const setFocusAfterTransition = () => {
        super.focus(params);
        this.node.removeEventListener('transitionend', setFocusAfterTransition);
      };

      this.node.addEventListener('transitionend', setFocusAfterTransition);
    } else {
      super.focus(params);
    }
  }

  /**
   * @return {{left: number, top: number}} - item's current css-translation
   */
  getCurrentTranslation() {
    const currentTranslation = getComputedStyle(this.node).transform.match(/matrix\(.*, (.*)?, (.*)?\)$/i) || [0, 0, 0];

    return {
      left: +currentTranslation[1],
      top: +currentTranslation[2]
    };
  }

  /**
   * Checks, will be drag item needed to update his position during a drag items shifting
   * @param {object} toShiftPosition - new position after shifting
   * @return {boolean} if 'true', it will be needed, otherwise - not needed
   * @public
   */
  isNeedForShiftTo(toShiftPosition) {
    const currentShift = this.getCurrentTranslation();

    if (currentShift.left || currentShift.top) {
      const currentLeft = this.coordinates.default.left + parseFloat(currentShift.left);
      const currentTop = this.coordinates.default.top + parseFloat(currentShift.top);

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

  /**
   * Update drag item's coordinates during the window resizing
   * @return {{left: number, top: number}} - resizing's shift
   */
  updateOnResize() {
    this.coordinates.current.update();

    const currentTranslation = this.getCurrentTranslation();
    const resizeShift = {
      left: this.coordinates.default.left - (this.coordinates.current.left - currentTranslation.left),
      top: this.coordinates.default.top - (this.coordinates.current.top - currentTranslation.top)
    };

    for (const key in this.coordinates) {
      if (this.coordinates.hasOwnProperty(key) && !(this.chosenDropArea && key === 'droppedIn')) {
        this.coordinates[key].update({
          left: this.coordinates[key].left - resizeShift.left,
          top: this.coordinates[key].top - resizeShift.top
        });
      }
    }

    return resizeShift;
  }
}

export default DragItem;
