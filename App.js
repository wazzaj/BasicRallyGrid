Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        this._loadData();
    },

    _loadData: function() {

        var myStore = Ext.create('Rally.data.wsapi.Store', {
            model: 'Portfolio Item/Initiative',
            autoLoad: true,
            listeners: {
                load: function(myStore, myData, success) {
                    this._processPortfolioItems(myStore);
                },
            scope: this
            },
        fetch: ['formattedID', 'ObjectID', 'Name']
        });  
    },

    _processPortfolioItems: function(itemStore) {
        itemStore.each(function(record) {
            var item = record.get('ObjectID');
            this._getPointsData(item,'2016-01-22TZ');
            this._getPointsData(item,'2016-01-30TZ');
        },this);
        this._loadGrid(itemStore);
    },

    _getPointsData: function(objid, piDate) {
        var pointsStore = Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            listeners: {
                load: function(pointsStore, pointsData, success) {
                    pointsStore.each(function (record) {
                        console.log(record.get('Name'), record.get('AcceptedLeafStoryPlanEstimateTotal'));
                    });             
                }
            },
            fetch: ['Name', 'AcceptedLeafStoryPlanEstimateTotal'],
            filters: [
                {
                    property: 'ObjectID',
                    operator: '=',
                    value: objid
                },
                {
                    property: '__At',
                    value: piDate
                }
            ]
        });
    },

    _loadGrid: function(myPIStore) {
        var myGrid = Ext.create('Rally.ui.grid.Grid', {
            store: myPIStore,
            columnCfgs: [
                'FormattedID', 'ObjectID', 'Name'
            ]
        });

        this.add(myGrid);
    }
});
