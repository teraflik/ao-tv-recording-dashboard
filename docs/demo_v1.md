## Using the Graph Timeline UI for TV Recordings

1. Hi, so in this video we are going to cover how to use the Graph Timeline UI for TV Recordings. So, let's start

2. So, there are two different GraphUIs, 

   1. one for the "Recording" table, which tracks the **Clipping/Uploading** status of recordings. This UI is at the endpoint `/graph_ui/recording`
   2. the other for "Invalid Frame Tracking" table, which tracks the **blank frames** in recordings. This UI is at the endpoint `/graph_ui/blank`. We'll come back again to this UI later.

3. We can go to the Tagger's Excel Sheet from this UI as well by clicking in here. Ok, so this is the taggers sheet. At the bottom, we can select the month. Ok, so coming back to the UI...

4. By default, both the endpoints show data for today's date. So, we don't need to worry about selecting today's date every time we come to the site to get live status.

5. In order to view past data, we can simply use this date-picker to select the particular date and then submit to get past date datas.

6. Both the UI refresh every 5mins so we are getting visualisation of live data in DB with a delay of 5mins in the worst case.

7. We'll come back to the summary table after we've gone through the timelines once, as it would be much simpler to explain then.

8. Ok, so now coming to the timelines.....

   1. For each channel, there are two devices 'a' and 'b' which are recording. So, we have separate timelines for each 'a' and 'b'.

   2. Each timeline spans 24 hr interval for the selected date according to Indian Standard Time.

   3. The Start / Stop recording entries are shown in a separate line and the recording slots in a different line for clarity.

   4. The timeline entries are fetched from the "Recording" table, where entries corresponding to each slot can have 4 different stages :-

      1. Clipping Started
      2. Clipping Done
      3. Uploading start
      4. Uploading Done

      The color code for the stages is here at the top.

      The timeline basically shows the latest stage for that corresponding slot. Like, here the latest stage is Uploading Done. So its blue. To get detailed info of all the stages of that slot, we can simply click on that slot which then redirects to a tabular view where we can see timestamps of exactly when it entered each stage.

   Ok, coming back to the GraphUI, apart from Start / Stop Recording, and the 4 different stages an entry can be in, there are two more stages here if we look at the labels...

   1. Empty
   2. Now Recording
   3. Failed

   Lets look at them one by one.

   1. **Empty** :- No recordings for that device.

   2. **Now Recording** :- This is a dummy entry. What I mean by dummy is that, there is no actual entry corresponding to this in the database. Actually, what happens is....

      Let's say the slot under consideration is 5:30 to 6:00. Now in the best case, any entry corresponding to this slot appears in Database after 6:10 only, when the first entry corresponding to **Clipping Started** comes. So, untill then, there is no entry in database. So, a dummy entry is created just for the user to know that now this slot is in recording stage. Since its a dummy entry, there is no redirection to table view when we click on this slot.

      

      So, in ideal case, the lifespan of each **"Now Recording"** stage is 40 mins. If no entry appears for that corresponding slot beyond 1 hr, then it goes to the **Failed** stage.

   3. **Failed** :- There are two scenarios when a slot goes to failed stage.

      1. First scenario is what we just covered now :-  that if there are no entries corresponding to a slot beyond 1 hr, then a dummy failed entry appears for that slot.

      2. Second scenario:- When there are intermediate entries corresponding to a slot but not the final "Uploading Done" entry for that slot, and it has been more than 24 hrs, then that slot also goes to **Failed** stage. If its within 24hrs, then the slot stays in the latest stage.

         In this second scenario, since there are actual DB entries, there is tableview redirection upon clicking on that slot.

9. Now, coming to blank frames summary in recordings page....

   These summarize the total blank frame minutes in the selected date's recordings. This also can be of 3 different stages :-

   1. No recordings available (Blue) :- If there are no recordings at all for that corresponding device.
   2. No blank frames (Green) :- If there are recordings, but no blank frames.
   3. X minutes blank frames (Red) :- When there is some blank frame in the device.

   We can get a detailed look at where exactly the blank frame happened by clicking on the summary, which redirects to Blank Timeline UI which we discussed in the beginning of this video. The blank UI is looks almost identical to this Recording Timeline UI. Just the difference is that it takes data from the invalid frame tracking. We'll cover it in a bit, just after finishing up this UI's summary table.

   

10. Ok, so now coming to the summary table.......... This is the summary table which basically summarizes the whole timeline per channel, per device for the selected date. That means, for each timeline, there is a corresponding summary.

    Now, the summary of a timeline can have 5 different states :-

    1. OK :- everything is working as per expectation. Nothing to worry about.
    2. Empty :- No entries in the corresponding timeline.
    3. inprogress :- if there is atleast one slot in **"Now Recording"** stage in the corresponding timeline and no slots with **Error** state.
    4. **blank** :- If the blank frame minutes summary for that corresponding timeline is non-zero, and no slots with **Error** state in the timeline.
    5. **Error** :- If there is atleast one slot in the timeline in **Failed** state.

11. Finally, now coming to the Blank Frames UI........

    As we discussed earlier, that we can get an indepth info about where exactly the blank frames have occured by just clicking in the minutes of blank frames.

    This redirects us to the Blank Timeline UI.

    Just like in the Recording Timeline UI, this also has timelines for each device. The different stages each slot can be are..

    