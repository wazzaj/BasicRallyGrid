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
        this._createArrayStore();

        var scope1 = this;

        var startStore = Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            listeners: {
                load: function(startStore, startData, success) {
                    var scope2 = scope1;
//                    console.log('1:',this.piType);
                    startStore.each(function(record) {
//                        console.log('2:',this.piType);
                        var scope3 = scope2;
                        var startPoints = record.get('AcceptedLeafStoryPlanEstimateTotal'); 

                        var endStore = Ext.create('Rally.data.lookback.SnapshotStore', {
                            autoLoad: true,
                            listeners: {
                                load: function(endStore, endData, success) {
//                                    console.log('3:',this.piType);
                                    endStore.each(function(record) {
                                        var itemName = record.get('Name');
                                        var totalPoints = record.get('AcceptedLeafStoryPlanEstimateTotal') - startPoints;
                                        console.log(itemName, 'total points = ', totalPoints);
                                        this._addRecordToArrayStore(itemName, totalPoints);
                                    },scope3);
//                                    console.log(this.pointsStore);
                                    scope2._createPointsGrid();
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
                    },scope1);
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
    },

    _createPointsGrid: function() {

        if(!this.pointsGrid) {
            this.pointsGrid = Ext.create('Rally.ui.grid.Grid', {
                store: this.pointsStore,
                columnCfgs: [
                    'Name', 'Points'
                ]
            });

        this.add(this.pointsGrid);
        }
    },
    
    _addRecordToArrayStore: function(n, p) {
        console.log('Add Record', n, p);

        var data = _.map(n, p, function(name, points) {
        return {
            "Name" : name,
            "Points" : points
            };
        });          

        console.log(data);

//        var data = new this.pointsRecord({
//            name: n,
//            points: p
//        });

//        this.pointsStore.add(data);
    },
    
    _createArrayStore: function() {

        if(!this.pointsStore) {

//            this.pointsRecord = Ext.data.Record.create([
//                {name: "Name", type: "string"},
//                {name: "Points", type: "integer"}
//            ]);    

            var fields = [
                {displayName: 'Name',   name: 'Name',   type: 'string'},
                {displayName: 'Points', name: 'Points', type: 'integer'}
            ];

            this.pointsStore = Ext.create('Ext.data.JsonStore', {
                fields: fields
//                data : data
            });
        }
    }


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
//    }
});
