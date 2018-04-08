(function () {
  var settings = {
    bounds: '#fourth-example',
    possibleToReplaceItem: true,
    shiftDragItems: true,
    dragItems: [
      {
        node: '#drag-item-4-1',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-4-2',
        data: null,
        ariaLabel: '',
        className: 'drag-item',
      },
      {
        node: '#drag-item-4-3',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-4-4',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-4-5',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      }
    ],
    onCreate: function (dndObj) {
      console.log(dndObj);
    }
  };

  var dnd = new CgDnd(settings);
})();