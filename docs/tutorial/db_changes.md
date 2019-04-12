# AO-TV-Recording DB Changes

This documents the changes made to the schema of tables used for TV Recording logs, so as to make a user-friendly UI.

## Changes Done

1. **Purpose:-** To get `channel_name` from `channel_value` in `sys1.recording` and `sys1.recording_tracking`.

   **Changes done:-**

    1. Make `channel_value` attribute in `sys1.channel_info` table as the **primary_key**.

       ```sql
       alter table channel_info
       add primary key(channel_value);
       ```

       

    2. Make a **foreign_key** reference from `channel_value` attribute of `sys1.recording` to `channel_value` attribute of `sys1.channel_info`.

       ```sql
       alter table sys1.recording
       add constraint FK_Recording
       foreign key (channel_value) references sys1.channel_info(channel_value);
       ```

       

    3. Make a **foreign_key** reference from `channel_value` attribute of `sys1.recording_tracking` to `channel_value` attribute of `sys1.channel_info`.

       ```sql
       alter table sys1.recording_tracking
       add constraint FK_Recording_Tracking
       foreign key (channel_value) references sys1.channel_info(channel_value);
       ```

       

2. **Purpose:-** To get logo_url for each channel

   **Changes done:-**

   1. Add a new column `logo_url` in `channel_info` table.

      ```sql
      alter table sys1.channel_info
      add logo_url varchar(2000);
      ```



## Authentication Database Addition

Databases existing are ...........

'archive_recording'
'archive_recording_tracking'
'channel_info'
'daily_report'
'filter_recording_tracking'
'invalid_frame_tracking'
'process_slots'
'recording'
'recording_limit'
'recording_tracking'

