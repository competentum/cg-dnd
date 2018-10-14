import Tooltip from '../Tooltip';

/**
 * Tooltip for dnd's elements
 */
class ElementTooltip extends Tooltip {
  _getCoordinates(elemCoords, location, position, shift) {
    const { x, y } = super._getCoordinates(elemCoords, location, position, shift);
    const { left, top } = elemCoords;

    return {
      x: x - left,
      y: y - top,
      global: {
        x,
        y
      }
    };
  }

  _checkMaxWidth(tooltipCoordinates, location) {
    super._checkMaxWidth(tooltipCoordinates.global, location);
  }
}

export default ElementTooltip;
