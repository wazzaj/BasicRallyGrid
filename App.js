Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        this._getPortfolioType();
        this._setStartDate();
        this._setEndDate();
        this._loadData();
    },

    _getPortfolioType: function() {
        var piTypeField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallyportfolioitemtypecombobox'
                }],
            renderTo: Ext.getBody().dom
        });
        this.add(piTypeField);
    },

    _setStartDate: function() {
        this.startDate = Ext.Date.add(new Date(), Ext.Date.DAY, -7);

        var startDateField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallydatefield',
                fieldLabel: 'Start Date',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
                        console.log(newvalue, oldvalue, object);
                        this.startdate = newvalue;
                        this._loadData();
                        },
                    scope: this
                    },    
                maxValue: Ext.Date.add(new Date(), Ext.Date.DAY, -1),
                value: this.startDate
                }],
            renderTo: Ext.getBody().dom
        });

        this.add(startDateField);
    },

    _setEndDate: function() {
        this.endDate = Ext.Date.add(new Date());

        var endDateField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallydatefield',
                fieldLabel: 'End Date',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
                        console.log(newvalue, oldvalue, object);
                        this.endDate = newvalue;
                        this._loadData();
                        },
                    scope: this
                    },    
                maxValue: Ext.Date.add(new Date()),
                value: this.endDate
                }],
            renderTo: Ext.getBody().dom
        });

        this.add(endDateField);
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
            console.log('Start Date is: ', this.startDate);
            console.log('End Date is: ', this.endDate);

            this._getPointsDifference(item,this.startDate, this.endDate);
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

//    _createArrayStoreFromRecords : function(records) {

//    var fields = [
//        {displayName: 'Formatted ID',   name: 'FormattedID'},
//        {displayName: 'Name',           name: 'Name'},
//        {displayName: 'Points',         name: 'Points'}
//    ];

    // convert records into a json data structure
//    var data = _.map(records,function(r) {
//        return {
//            "FormattedID" :               
//                r.get("ItemObject").get("FormattedID"),
//            "Name" :      
//                r.get("PointsObject").get("Name"),
//            "Points" :   
//                r.get("PointsObject").get("Points")
//        };
//    });

//        var pistore = Ext.create('Ext.data.JsonStore', {
//            fields: fields,
//            data : data
//        });

//        app.grid = new Ext.grid.GridPanel(
//            {
//                header: false,
//                id : 'tsGrid',
//                title: 'Portfolio Item Points Report',
//                features: [
//                    {ftype: 'grouping',  showSummaryRow: true, groupHeaderTpl: ' {name}'},
//                    {ftype: 'summary'}
//                ],
//                store: pistore,
//                columns: _.map(fields,function(f){
//                            text:f.displayName,
//                            dataIndex:f.name
//                })
//            }
//        );

//        this.add(app.grid);
//    }
});
