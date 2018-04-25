(function () {
  var exampleContainer = document.getElementById('third-example'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#dnd-3',
    dragItems: [
      {
        node: '#drag-item-3-4',
        data: 3,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-5',
        data: 4,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-2',
        data: 1,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-3',
        data: 2,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-1',
        data: 0,
        ariaLabel: '',
        className: 'custom-class'
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      console.log(params)
      if (params.dragItem1 && params.dragItem2) {
        params.dragItem1.correct = params.dragItem1.index === params.dragItem1.data;
        params.dragItem2.correct = params.dragItem2.index === params.dragItem2.data;

        if (params.dragItem1.correct) {
          params.dragItem1.disable();
          params.dragItem1.addClass('correct-item');
        }

        if (params.dragItem2.correct) {
          params.dragItem2.disable();
          params.dragItem2.addClass('correct-item');
        }
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
      dndObj.dragItems.forEach(function (item) {
        item.correct = item.index === item.data;
      });
    },
    onDragItemSelect: function (e, params) {
      if (params.chosenDraggedItem !== params.dragItem && !params.chosenDraggedItem.disabled && !params.dragItem.disabled) {
        this.shuffleDragItems(params.chosenDraggedItem, params.dragItem);
      }
    },
  };

  var dnd = new CgDnd(settings);

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: 'correct-item' });
  });
})();