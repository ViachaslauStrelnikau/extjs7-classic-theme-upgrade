Ext.define('TestApp.view.compatibility.Controls', {
    extend: 'Ext.panel.Panel',
    xtype: 'compatibility-controls',

    requires: [
        'Ext.button.Button',
        'Ext.button.Split',
        'Ext.menu.Menu',
        'Ext.panel.Panel',
        'Ext.tab.Panel',
        'Ext.toolbar.Toolbar'
    ],

    title: 'Controls',
    cls: 'compatibility-controls',
    bodyPadding: 12,
    scrollable: 'y',
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    items: [{
        xtype: 'toolbar',
        itemId: 'compatibility-toolbar',
        title: 'Toolbar fixture',
        items: [{
            text: 'Toolbar action',
            iconCls: 'fa-bolt',
            handler: function () {
                Ext.ComponentQuery.query('#compatibility-action-result')[0].setValue('Toolbar action completed');
            }
        }, {
            xtype: 'splitbutton',
            text: 'Split action',
            iconCls: 'fa-caret-down',
            menu: [{
                text: 'First menu action',
                handler: function () {
                    Ext.ComponentQuery.query('#compatibility-action-result')[0].setValue('First menu action completed');
                }
            }, {
                text: 'Second menu action'
            }]
        }, '->', {
            xtype: 'tbtext',
            text: 'Toolbar text fixture'
        }]
    }, {
        xtype: 'container',
        itemId: 'compatibility-button-row',
        layout: {
            type: 'hbox',
            align: 'middle'
        },
        defaults: {
            margin: '0 8 8 0'
        },
        items: [{
            xtype: 'button',
            itemId: 'compatibility-normal-button',
            text: 'Normal action',
            iconCls: 'fa-check',
            handler: function () {
                Ext.ComponentQuery.query('#compatibility-action-result')[0].setValue('Normal action completed');
            }
        }, {
            xtype: 'button',
            itemId: 'compatibility-toggle-button',
            text: 'Toggle action',
            enableToggle: true,
            pressed: false,
            iconCls: 'fa-toggle-off'
        }, {
            xtype: 'button',
            itemId: 'compatibility-disabled-button',
            text: 'Disabled action',
            disabled: true
        }, {
            xtype: 'button',
            itemId: 'compatibility-long-button',
            text: 'Long button text for clipping and alignment checks',
            iconAlign: 'right',
            iconCls: 'fa-arrow-right'
        }]
    }, {
        xtype: 'displayfield',
        itemId: 'compatibility-action-result',
        fieldLabel: 'Action result',
        value: 'No action'
    }, {
        xtype: 'panel',
        itemId: 'compatibility-collapsible-panel',
        title: 'Collapsible panel fixture',
        collapsible: true,
        collapsed: false,
        margin: '8 0',
        bodyPadding: 8,
        html: 'This panel supports collapse and expand checks.'
    }, {
        xtype: 'tabpanel',
        itemId: 'compatibility-inner-tabs',
        height: 190,
        margin: '8 0',
        items: [{
            title: 'First tab',
            itemId: 'compatibility-first-tab',
            bodyPadding: 8,
            html: 'First tab content.'
        }, {
            title: 'Second tab',
            itemId: 'compatibility-second-tab',
            bodyPadding: 8,
            html: 'Second tab content with a longer label.'
        }]
    }]
});
