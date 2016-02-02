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
        fetch: ['FormattedID','ObjectID', 'Name']
        });  
    },

    _processPortfolioItems: function(itemStore) {
        itemStore.each(function(record) {
            var item = record.get('ObjectID');
            this._getPointsDifference(item,'2016-01-22TZ','2016-01-30TZ');
        },this);
        this._loadGrid(itemStore);
    },

    _getPointsDifference: function(objid, startDate, endDate) {
        var startStore = Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            listeners: {
                load: function(startStore, startData, success) {
                    startStore.each(function(record) {
                        var startPoints = record.get('AcceptedLeafStoryPlanEstimateTotal'); 

                        var endStore = Ext.create('Rally.data.lookback.SnapshotStore', {
                            autoLoad: true,
                            listeners: {
                                load: function(endStore, endData, success) {
                                    endStore.each(function(record) {
                                        var totalPoints = record.get('AcceptedLeafStoryPlanEstimateTotal') - startPoints;
                                        console.log(record.get('Name'), 'total points = ', totalPoints);
                                    },this);
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
                                    value: endDate
                                }
                            ]
                        });
                    },this);
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
                    value: startDate
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
