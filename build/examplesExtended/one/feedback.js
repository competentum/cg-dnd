function getCurrentResultMessage(reamainingItems, items) {
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

  var copy = items.slice(),
      correctMessagePart = ' has correct position at ',
      resultMsg = '';

  copy.sort(function (item1, item2) {
    return item1.index > item2.index;
  });

  copy.forEach(function (item) {
    if (item.correct) {
      resultMsg += item.getSetting('ariaLabel') + correctMessagePart + item.chosenDropArea.getSetting('ariaLabel') + '. ';
    }
  });

  return { message: resultMsg };
}