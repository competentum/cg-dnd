function getCurrentResultMessage(reamainingItems, items, areas) {
  var ALL_CORRECT_MESSAGE = 'Congratulations! All drag items are correct.',
      ALL_INCORRECT_MESSAGE = 'All items are incorrect! Try again. ';

  if (!reamainingItems.length) {
    return {
      message: ALL_CORRECT_MESSAGE,
      isAllCorrect: true
    };
  }

  if (reamainingItems.length === items.length) {
    return { message: ALL_INCORRECT_MESSAGE };
  }

  var correctMessagePart = ' has next correct items: ',
      resultMsg = '';

  areas.forEach(function (area) {
    if (area.innerDragItemsCount) {
      resultMsg += area.getSetting('ariaLabel') + correctMessagePart;
      area.innerDragItems.forEach(function (item, index) {
        resultMsg += item.getSetting('ariaLabel') + (index === area.innerDragItems.length - 1 ? '. ' : ', ');
      });
    }
  });

  return { message: resultMsg + ' Drag remaining items.' };
}