Ext.define('TestApp.view.compatibility.FormsAndFloats', (function () {
    var compatibilityWindow;

    return {
        extend: 'Ext.panel.Panel',
        xtype: 'compatibility-forms-floats',

        requires: [
            'Ext.button.Button',
            'Ext.form.Panel',
            'Ext.form.field.ComboBox',
            'Ext.form.field.Text',
            'Ext.menu.Menu',
            'Ext.tip.ToolTip',
            'Ext.window.MessageBox',
            'Ext.window.Window'
        ],

        title: 'Forms and floating components',
        cls: 'compatibility-forms-floats',
        bodyPadding: 12,
        scrollable: 'y',
        layout: {
            type: 'vbox',
            align: 'stretch'
        },

        items: [{
            xtype: 'form',
            itemId: 'compatibility-form',
            title: 'Form fixture',
            bodyPadding: 8,
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: [{
                xtype: 'container',
                flex: 1,
                layout: 'anchor',
                defaults: {
                    anchor: '95%',
                    labelWidth: 120
                },
                items: [{
                    xtype: 'textfield',
                    itemId: 'compatibility-required-field',
                    fieldLabel: 'Required value',
                    allowBlank: false,
                    value: ''
                }, {
                    xtype: 'combo',
                    itemId: 'compatibility-combo',
                    fieldLabel: 'Choice',
                    store: ['Alpha', 'Beta', 'Gamma'],
                    queryMode: 'local',
                    editable: false,
                    forceSelection: true,
                    value: 'Alpha'
                }, {
                    xtype: 'checkboxfield',
                    itemId: 'compatibility-checkbox',
                    fieldLabel: 'Option',
                    boxLabel: 'Enabled option',
                    checked: true
                }, {
                    xtype: 'radiogroup',
                    itemId: 'compatibility-radio-group',
                    fieldLabel: 'Mode',
                    columns: 2,
                    vertical: false,
                    items: [{ boxLabel: 'Standard', name: 'mode', inputValue: 'standard', checked: true },
                        { boxLabel: 'Compact', name: 'mode', inputValue: 'compact' }]
                }, {
                    xtype: 'textfield',
                    itemId: 'compatibility-readonly-field',
                    fieldLabel: 'Read only',
                    value: 'Read-only value',
                    readOnly: true
                }, {
                    xtype: 'textfield',
                    itemId: 'compatibility-disabled-field',
                    fieldLabel: 'Disabled',
                    value: 'Disabled value',
                    disabled: true
                }]
            }, {
                xtype: 'container',
                width: 220,
                margin: '0 0 0 12',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [{
                    xtype: 'button',
                    itemId: 'compatibility-validate-button',
                    text: 'Validate required value',
                    handler: function (button) {
                        var panel = button.up('form'),
                            field = panel.down('#compatibility-required-field'),
                            result = panel.down('#compatibility-validation-result');

                        field.validate();
                        result.setValue(field.isValid() ? 'Valid' : 'Invalid');
                    }
                }, {
                    xtype: 'displayfield',
                    itemId: 'compatibility-validation-result',
                    fieldLabel: 'Validation result',
                    value: 'Not checked'
                }, {
                    xtype: 'button',
                    itemId: 'compatibility-menu-button',
                    text: 'Open menu',
                    menu: [{
                        text: 'Menu action',
                        handler: function () {
                            Ext.ComponentQuery.query('#compatibility-validation-result')[0].setValue('Menu action completed');
                        }
                    }, {
                        text: 'Open submenu',
                        menu: [{
                            text: 'Submenu action'
                        }]
                    }]
                }, {
                    xtype: 'button',
                    itemId: 'compatibility-tooltip-button',
                    text: 'Show tooltip',
                    listeners: {
                        afterrender: function (button) {
                            Ext.create('Ext.tip.ToolTip', {
                                target: button.el,
                                html: 'Compatibility tooltip fixture',
                                showDelay: 0,
                                dismissDelay: 0
                            });
                        }
                    }
                }, {
                    xtype: 'button',
                    itemId: 'compatibility-window-button',
                    text: 'Open window',
                    handler: function () {
                        if (!compatibilityWindow) {
                            compatibilityWindow = Ext.create('Ext.window.Window', {
                                itemId: 'compatibility-window',
                                title: 'Compatibility window',
                                width: 360,
                                height: 220,
                                x: 8,
                                y: 8,
                                modal: false,
                                resizable: true,
                                draggable: true,
                                constrain: true,
                                alwaysOnTop: false,
                                closeAction: 'hide',
                                layout: 'fit',
                                items: [{
                                    xtype: 'panel',
                                    bodyPadding: 12,
                                    html: 'Window and dialog fixture content.'
                                }]
                            });
                        }
                        compatibilityWindow.show();
                    }
                }, {
                    xtype: 'button',
                    itemId: 'compatibility-dialog-button',
                    text: 'Open dialog',
                    handler: function () {
                        Ext.Msg.show({
                            title: 'Compatibility dialog',
                            message: 'Dialog interaction fixture.',
                            buttons: Ext.Msg.OKCANCEL,
                            icon: Ext.Msg.QUESTION
                        });
                    }
                }]
            }],
            listeners: {
                afterrender: function (form) {
                    form.down('#compatibility-required-field').validate();
                }
            }
        }, {
            xtype: 'panel',
            itemId: 'compatibility-scroll-container',
            title: 'Scrollable container fixture',
            bodyCls: 'compatibility-scroll-body',
            height: 150,
            margin: '12 0 0',
            scrollable: true,
            bodyPadding: 8,
            items: [{
                xtype: 'component',
                width: 1400,
                html: '<p>Scrollable content line 1.</p><p>Scrollable content line 2.</p><p>Scrollable content line 3.</p><p>Scrollable content line 4.</p><p>Scrollable content line 5.</p><p>Scrollable content line 6.</p><p>Scrollable content line 7.</p><p>Scrollable content line 8.</p>'
            }]
        }]
    };
})());
