function getCurrentResultMessage(reamainingItems, items, withPosition) {
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
      correctMessagePart = ' Correct items are: ',
      incorrectMessagePart = ' Incorrect items are: ',
      commonItemsCount = items.length,
      positionPart;

  copy.sort(function (item1, item2) {
    return item1.index > item2.index;
  });

  copy.forEach(function (item) {
    positionPart = withPosition ? ' - position ' + (item.index + 1) + ' of ' + commonItemsCount + ', ' : '. ';

    if (item.correct) {
      correctMessagePart += item.getSetting('ariaLabel') + positionPart;
    } else {
      incorrectMessagePart += item.getSetting('ariaLabel') + positionPart;
    }
  });

  return { message: correctMessagePart + '. ' + incorrectMessagePart + '. ' };
}