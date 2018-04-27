import cgUtils from 'cg-component-utils';

const utils = {
  IS_TOUCH: !!navigator.userAgent.match(/Android|webOS|webOS|iPad|iPod|BlackBerry|Windows Phone/i),
  IS_IE: (/MSIE|Trident/i).test(navigator.userAgent),
  IS_ANDROID: (/(android)/i).test(navigator.userAgent),
  IS_IPAD: (/iPad/).test(navigator.userAgent),

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
   */
  showSettingError(settingName, settingValue, validMessage) {
    throw new Error(`"${settingValue}" isn't valid value for "${settingName}"! ${validMessage}`);
  },

  getElement(element, container = document) {
    if (element instanceof Element || element === document) {
      return element;
    }

    const elementContainer = container !== document && !(container instanceof Element) ? document.querySelector(container) : container;

    if (!elementContainer) {
      this.showSettingError('container', container, 'Please set html-node element');
    }

    if (typeof element === 'string' && !element.length) {
      return null;
    }

    return elementContainer.querySelector(element);
  },

  /**
   * Get node rect angles coordinates. Add boundary fault for cases, when drag items left/top-scopes equals 0
   * (otherwise drag items are clinging to scopes)
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

  /**
   * Get node's current max-moving rectangle coordinates
   * @param {object} nodeParams - DOMRect params
   * @param {object} boundsParams - DOMRect params
   * @param {number} mouseX - horizontal mouse shift about dragged node
   * @param {number} mouseY - vertical mouse shift about dragged node
   * @return {object} - rect coordinates
   */
  calculateCurrentBounds(nodeParams, boundsParams, mouseX, mouseY) {
    return {
      left: boundsParams.left + mouseX - nodeParams.left,
      top: boundsParams.top + mouseY - nodeParams.top,
      right: boundsParams.right + mouseX - nodeParams.right,
      bottom: boundsParams.bottom + mouseY - nodeParams.bottom
    };
  },

  /**
   * Get node's coordinates in current possible rectangle
   * @param {number} position - current pageX/pageY position
   * @param {number} min - min rectangle's limit value
   * @param {number} max - max rectangle's limit value
   * @return {number} - valid value
   */
  applyLimit(position, min, max) {
    return Math.min(Math.max(position, min), max);
  },

  /**
   * Checks intersection of two rectangles
   * @param {object} rect1 - first rect DOMRect coordinates
   * @param {object} rect2 - second rect DOMRect coordinates
   * @return {boolean} - return intersection result (true/false)
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

  /**
   * Get index of array element, which corresponds to the condition in callback
   * @param {array} array
   * @param {function} callBack
   * @return {number} index
   */
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

  /**
   * Check, is item included to array
   * @param {array} array
   * @param {*} item
   * @return {boolean} result
   */
  includes(array, item) {
    if (Array.prototype.includes) {
      return array.includes(item);
    }

    for (let i = 0; i < array.length; i++) {
      if (array[i] === item) {
        return true;
      }
    }

    return false;
  },

  /**
   * Fill array by one value
   * @param {array} array
   * @param {number} value
   * @param {number} from - from index
   * @param {number} to - to index
   * @return {array} filled array
   */
  fillArray(array, value, from = 0, to = array.length) {
    if (Array.prototype.fill) {
      return array.fill(value, from, to);
    }

    for (let i = from; i < to; i++) {
      array[i] = value;
    }

    return array;
  },

  /**
   * Replace two array elements between themselves
   * @param {array} array
   * @param {object} item1 - drag item
   * @param {object} item2 - drag item
   */
  replaceArrayItems(array, item1, item2) {
    const item1Index = array.indexOf(item1);
    const item2Index = array.indexOf(item2);

    [array[item1Index], array[item2Index]] = [array[item2Index], array[item1Index]];

    const bufIndex = item1.index;

    item1.index = item2.index;
    item2.index = bufIndex;
  },

  /**
   * Move array element to new position and shift remaining array elements
   * @param {array} array
   * @param {object} movedItemIndex - moved item index in array
   * @param {object} toIndex - wanted position
   */
  moveArrayItems(array, movedItemIndex, toIndex) {
    const remainingIndexes = array.map((item) => item.index);

    array.splice(toIndex, 0, array.splice(movedItemIndex, 1)[0]);
    array.forEach((item, i) => {
      item.index = remainingIndexes[i];
    });
  },

  createHTML(params = {}) {
    const element = cgUtils.createHTML(params.html.match(/^<.*?>.*<\/.*?>$/) ? params.html : `<div>${params.html}</div>`);

    params.className && cgUtils.addClass(element, params.className);

    if (params.attrs) {
      for (const key in params.attrs) {
        if (params.attrs.hasOwnProperty(key)) {
          element.setAttribute(key, params.attrs[key]);
        }
      }
    }

    if (params.container) {
      const el = this.getElement(params.container);

      el.appendChild(element);
    }

    return element;
  }
};

export default utils;
