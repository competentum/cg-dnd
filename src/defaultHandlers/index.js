/**
 * Default onDragItemSelect handler
 * @param {Object} e
 * @param {Object} params
 */
export const onDragItemSelect = (e, params) => {
  const { dnd, dragItem, chosenDraggedItem, dropAreas, allowedDropAreas } = params;

  if (chosenDraggedItem && !dropAreas.length) {
    if (chosenDraggedItem !== dragItem && !chosenDraggedItem.disabled && !dragItem.disabled) {
      dnd.shuffleDragItems(chosenDraggedItem, dragItem, (item1) => {
        // TODO: Add live announce

        item1.focus();
      });
    }
  } else if (allowedDropAreas.length) {
    allowedDropAreas[0].focus();
  }
};

/**
 * Default onDropAreaSelect handler
 * @param {Object} e
 * @param {Object} params
 */
export const onDropAreaSelect = (e, params) => {
  const { dnd: { settings }, currentDraggedItem, dropArea, droppedItems } = params;
  const selectDelay = 0; // Is needed for correct a11y on mobile devices

  if (currentDraggedItem) {
    currentDraggedItem.placeToDropArea({
      dropArea,
      checkAfterAnimation: true
    });
  } else if (settings.possibleToReplaceDroppedItem) {
    switch (droppedItems.length) {
      case 0:
        return;
      case 1:
        droppedItems[0].select(selectDelay);
        break;
      default:
        droppedItems[0].focus();
    }
  }
};

