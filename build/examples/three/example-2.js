(function () {
  var exampleContainer = document.getElementById('second-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#dnd-2',
    shiftDragItems: true,
    dragItems: [
      {
        node: '#drag-item-2-4',
        data: 3,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-2',
        data: 1,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-5',
        data: 4,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-3',
        data: 2,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-1',
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

        params.dragItem1.correct && correctItems.push(params.dragItem1);
        params.dragItem2.correct && correctItems.push(params.dragItem2);
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
      dndObj.settings.dragItems.forEach(function (item) {
        item.correct = item.index === item.data;
      });
    },
    onDragItemSelect: function (e, params) {
      if (params.currentDraggedItem !== params.dragItem) {
        this.shuffleDragItems(params.currentDraggedItem, params.dragItem);
      }
    },
  };

  var dnd = new CgDnd(settings);
  var correctItems = [];

  checkButton.addEventListener('click', function () {
    dnd.settings.dragItems.forEach((item) => {
      item.correct = item.index === item.data;

      if (item.correct) {
        item.addClass('correct-item');
      }
    });
    dnd.disableFocusOnCorrectItems();
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: 'correct-item' });
  });
})();