(function () {
  var settings = {
    bounds: '#second-example',
    //bounds: [0, 0, 800, 600],
    alignRemainingDragItems: true,
    handler: '.handler',
    maxItemsInDropArea: 0,
    possibleToReplaceDroppedItem: true,
    snapAlignParams: {
      horizontalAlign: 'center',
      verticalAlign: 'top',
      withDroppedItemCSSMargins: true
    },
    dragItems: [
      {
        node: '#drag-item-11',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-12',
        data: null,
        ariaLabel: '',
        className: 'drag-item',
      },
      {
        node: '#drag-item-13',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-14',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-15',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-11',
        ariaLabel: '',
        data: null,
        className: 'drop-area',
      },
      {
        node: '#drop-area-12',
        ariaLabel: '',
        data: null,
        className: 'drop-area',
        snapAlignParams: {
          verticalAlign: 'bottom',
          horizontalAlign: 'right',
          withDroppedItemCSSMargins: false
        }
      },
      {
        node: '#drop-area-13',
        ariaLabel: '',
        data: null,
        className: 'drop-area',
        snapAlignParams: {
          verticalAlign: 'center'
        }
      }
    ],
    onCreate: function (dndObj) {
      console.log(dndObj);
    }
  };

  var dnd = new CgDnd(settings);
})();