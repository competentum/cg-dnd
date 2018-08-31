import Tooltip from '../Tooltip';

/**
 * Tooltip for dnd's elements
 */
class ElementTooltip extends Tooltip {
  getCoordinates(elemCoords, location, position, shift) {
    const { x, y } = super.getCoordinates(elemCoords, location, position, shift);
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

  checkMaxWidth(tooltipCoordinates, location) {
    super.checkMaxWidth(tooltipCoordinates.global, location);
  }
}

export default ElementTooltip;
