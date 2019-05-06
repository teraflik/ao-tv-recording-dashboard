Vue.component('schedules', {
    props: ['schedule_list'],
    template:
    `
    <table class="table table-sm text-center">
            <thead class="thead-dark">
                <th>Channel</th>
                <th>Devices</th>
                <th>Start time</th>
                <th>Stop time</th>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
                <th>Saturday</th>
                <th>Sunday</th>
            </thead>
            <tbody>
                <tr
                    is="schedule"
                    v-for="schedule in schedule_list" :key="schedule.id"
                    :channel="schedule.channel_name"
                    :devices="schedule.devices"
                    :rec_start="schedule.rec_start"
                    :rec_stop="schedule.rec_stop"
                    :monday="schedule.monday"
                    :tuesday="schedule.tuesday"
                    :wednesday="schedule.wednesday"
                    :thursday="schedule.thursday"
                    :friday="schedule.friday"
                    :saturday="schedule.saturday"
                    :sunday="schedule.sunday"
                    ></tr>
            </tbody>
        </table>
    `
})

Vue.component('schedule', {
    props: ['id', 'channel', 'devices', 'rec_start', 'rec_stop', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'node'],
    data () {
        return {
            bus: new Vue(),
        }
    },
    template:
    `<tr>
        <td>{{ channel }}</td>
        <td>{{ devices }}</td>
        <td>{{ rec_start }}</td>
        <td>{{ rec_stop }}</td>
        <td><i v-if="monday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="tuesday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="wednesday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="thursday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="friday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="saturday" class="fas fa-check-circle text-success"></i></td>
        <td><i v-if="sunday" class="fas fa-check-circle text-success"></i></td>
    </tr>`
})

new Vue({
    el: '#recording_guides',
    data: {
        apiURL: 'api/schedules/',
        schedule_list: [],
        loading: true,
        errored: false
    },
    created () {
        this.getRecordingGuidesData()
    },
    methods: {
        getRecordingGuidesData: function (scheduleID = false) {
            var endpoint = scheduleID ? this.apiURL + scheduleID : this.apiURL
            
            fetch(endpoint).then(response => response.json())
            .then(data => this.schedule_list = data)
            .catch(error => {
                console.log(error)
                this.errored = true
            })
            .finally(() => this.loading = false)
        }
    }
})