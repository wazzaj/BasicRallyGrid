Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {

        this.pulldownContainer = Ext.create('Ext.container.Container', {
            layout: {
                type: 'hbox',
                align: 'stretch'
            }
        });

        this.add(this.pulldownContainer);

        this._getPortfolioType();
        this._setStartDate();
        this._setEndDate();
//        this._loadData();
    },

    _getPortfolioType: function() {

        var piTypeField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallyportfolioitemtypecombobox',
                fieldLabel: 'Item Type',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
                        this.piType = x.getRecord().get('Name');
                        this._loadData();
                        },
                    scope: this    
                    }
                }],
            renderTo: Ext.getBody().dom
        });
        this.pulldownContainer.add(piTypeField);
    },

    _setStartDate: function() {
        this.startDate = Ext.Date.add(new Date(), Ext.Date.DAY, -7);

        var startDateField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallydatefield',
                fieldLabel: 'Start Date',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
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

        this.pulldownContainer.add(startDateField);
    },

    _setEndDate: function() {
        this.endDate = Ext.Date.add(new Date());

        var endDateField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallydatefield',
                fieldLabel: 'End Date',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
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

        this.pulldownContainer.add(endDateField);
    },

    _loadData: function() {
        var myFilters = [
            {
                property: 'PortfolioItemType.Name',
                operator: '=',
                value: this.piType
            }
        ];    

        if(this.itemStore) {
            this.itemStore.setFilter(myFilters);
            this.itemStore.load();
        } else {
            this.itemStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'Portfolio Item',
                autoLoad: true,
                filters: myFilters,
                listeners: {
                    load: function(myStore, myData, success) {
                        this._processPortfolioItems();
                    },
                    scope: this    
                },
                fetch: ['FormattedID','ObjectID', 'Name', 'PortfolioItemType']
            });
        }      
    },

    _processPortfolioItems: function() {
        this.itemStore.each(function(record) {
            var item = record.get('ObjectID');
            this._getPointsDifference(item,this.startDate, this.endDate);
        },this);
        this._createGrid();
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

    _createGrid: function() {

        if(!this.myGrid) {
            this.myGrid = Ext.create('Rally.ui.grid.Grid', {
                store: this.itemStore,
                columnCfgs: [
                    'FormattedID', 'Name', 'PortfolioItemType'
                ]
            });

        this.add(this.myGrid);
        }
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
