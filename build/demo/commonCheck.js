function checkActivity(dnd) {
    var correctItemsCount = dnd.dragItems.reduce(function (result, item) {
        if (item.correct) {
            result++;
        }

        return result;
    }, 0);

    dnd.resetIncorrectItems();

    if (correctItemsCount === dnd.dragItems.length) {
        dnd.say('Congratulations! You passed the activity.');
    } else {
        dnd.firstRemainingDragItem.focus({ liveText: 'Some of your answers are incorrect! Please, try again. ' });
    }
};
