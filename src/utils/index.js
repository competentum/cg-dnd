const utils = {
  IS_TOUCH: !!navigator.userAgent.match(/Android|webOS|webOS|iPad|iPod|BlackBerry|Windows Phone/i),

  getDeviceEvents() {
    if (this.IS_TOUCH) {
      return {
        dragStart: 'touchstart',
        dragMove: 'touchmove',
        draEnd: 'touchend'
      };
    }

    return {
      dragStart: 'mousedown',
      dragMove: 'mousemove',
      draEnd: 'mouseup'
    };
  },

  /**
   * Shows error in console.
   * @param {string} settingName - name of setting property.
   * @param {string|number|object|boolean} settingValue - wrong value
   * @param {string} validMessage - message, which contains correct value type
   * @private
   */
  showSettingError(settingName, settingValue, validMessage) {
    const errorValue = typeof settingValue === 'string' ? settingValue : typeof settingValue;

    throw new Error(`${errorValue} isn't valid value for ${settingName}! ${validMessage}`);
  },

  getElement(element, container = document) {
    const elementContainer = container !== document && !(container instanceof Element) ? document.querySelector(container) : container;

    if (!elementContainer) {
      this.showSettingError('container', container, 'Please set html-node element');
    }

    if (typeof element === 'string' && !element.length) {
      return null;
    }

    return element instanceof Element ? element : elementContainer.querySelector(element);
  },

  /**
   * Get node rect angles coordinates.
   * @param {object} node - html-element
   * @return {object} - rect coordinates
   */
  getElementPosition(node) {
    const isDocument = node === document.documentElement;
    const BOUNDARY_FAULT = 0.01;
    const rect = this.translateDOMRectToObject(node.getBoundingClientRect());

    rect.top += pageYOffset + (rect.top === 0 ? BOUNDARY_FAULT : 0);
    rect.bottom = (!isDocument ? rect.bottom : document.documentElement.clientHeight) + pageYOffset;
    rect.left += pageXOffset + (rect.left === 0 ? BOUNDARY_FAULT : 0);
    rect.right += pageXOffset;

    return rect;
  },

  calculateCurrentBounds(nodeParams, boundsParams, mouseX, mouseY) {
    return {
      left: boundsParams.left + mouseX - nodeParams.left,
      top: boundsParams.top + mouseY - nodeParams.top,
      right: boundsParams.right + mouseX - nodeParams.right,
      bottom: boundsParams.bottom + mouseY - nodeParams.bottom
    };
  },

  applyLimit(position, min, max) {
    return Math.min(Math.max(position, min), max);
  },

  /**
   * Checks intersection of two rectangles
   * @param {object} rect1 - first rect DOMRect coordinates
   * @param {object} rect2 - second rect DOMRect coordinates
   * @return {boolean} - return intersection result (true/false)
   * @private
   */
  isIntersectRect(rect1, rect2) {
    return !(rect2.left > rect1.right
             || rect2.right < rect1.left
             || rect2.top > rect1.bottom
             || rect2.bottom < rect1.top);
  },

  translateDOMRectToObject(domRectObj) {
    return {
      left: domRectObj.left,
      top: domRectObj.top,
      right: domRectObj.right,
      bottom: domRectObj.bottom,
      width: domRectObj.width,
      height: domRectObj.height,
      x: domRectObj.x,
      y: domRectObj.y
    };
  },

  /**
   * Checks and fix ID selector string.
   * @param {string} selectorString - checked string.
   * @return {string} - return valid ID selector string
   * @private
   */
  checkIDSelector(selectorString) {
    if (selectorString.search(/^\./) !== -1) {
      throw new Error('ID selector was expected, but Class selector was found');
    }

    return selectorString.search(/^#/) === -1 ? `#${selectorString}` : selectorString;
  },

  /**
   * Checks and fix class selector string.
   * @param {string} selectorString - checked string.
   * @return {string} - return valid class selector string
   * @private
   */
  checkClassSelector(selectorString) {
    if (selectorString.search(/^#/) !== -1) {
      throw new Error('Class selector was expected, but ID selector was found');
    }

    return selectorString.search(/^\./) === -1 ? `.${selectorString}` : selectorString;
  },

  /**
   * Checks user setting's boolean values.
   * @param {boolean|string|number} value - checked value.
   * @return {boolean|null} - return boolean value or null
   * @private
   */
  checkOnBoolean(value) {
    let boolElem = null;

    if (typeof value === 'string') {
      boolElem = value.search(/^true$/i) !== -1 ? true : value.search(/^false$/i) !== -1 ? false : null;
    } else {
      boolElem = !!value;
    }

    return boolElem;
  },

  findIndex(array, callBack) {
    if (Array.prototype.findIndex) {
      return array.findIndex(callBack);
    }

    for (let i = 0; i < array.length; i++) {
      if (callBack(array[i])) {
        return i;
      }
    }

    return -1;
  },

  fillArray(array, value, from = 0, to = array.length) {
    if (Array.prototype.fill) {
      return array.fill(value, from, to);
    }

    for (let i = from; i < to; i++) {
      array[i] = value;
    }

    return array;
  },

  replaceArrayItems(array, item1, item2) {
    [array[item1.index], array[item2.index]] = [array[item2.index], array[item1.index]];

    const bufIndex = item1.index;

    item1.index = item2.index;
    item2.index = bufIndex;
  },

  moveArrayItems(array, movedItemIndex, toIndex) {
    array.splice(toIndex, 0, array.splice(movedItemIndex, 1)[0]);

    array.forEach((item, i) => {
      item.index = i;
    });
  }
};

export default utils;
