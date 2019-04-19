## Expected Slots for TV Recording

### What is it?

Explicitly maintaining the expected recording slots of a given channel for a given day.

### Why is it needed?

* Currently, the only way to determining recording slots is by looking at the START & STOP entries in the DB. But often, it has been seen that the script that makes these entries in DB fails to do so. In such a case, there is no way for us to verify that this isn't the expected behaviour, since the ground truth is defined on the basis of these DB entries only.

* The failure entries in the Timeline UI are determined using the slots defined by these DB entries. Hence, failure detection is dependent upon DB entries, which shouldn't be ideally.
* Similarly, the weekly and daily reports being generated again use the slots  from these DB entries and filter_recording_entries to determine the net data loss. Hence, again we are depending upon DB entries to determine the net loss.

### Solution

#### DB Changes

* Have a separate DB Table that specifies the expected recording slots of a given channel in a given day.
* Since the recording slots for a given channel may vary with time, it would be better to also specify time_range for which each of these slot information is valid.

#### WebApp Changes

* Make use of this new DB to determine failure entries in the timeline and total loss in reports.

