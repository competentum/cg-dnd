var DEVICES = {
  IS_TOUCH: !!navigator.userAgent.match(/Android|webOS|webOS|iPad|iPod|BlackBerry|Windows Phone/i),
  IS_IE: (/MSIE|Trident/i).test(navigator.userAgent),
  IS_ANDROID: (/(android)/i).test(navigator.userAgent),
  IS_IPAD: (/iPad/).test(navigator.userAgent),
  IS_FF: (/(firefox)/i.test(navigator.userAgent)),
  IS_MAC: (/Mac/.test(navigator.userAgent)),
};