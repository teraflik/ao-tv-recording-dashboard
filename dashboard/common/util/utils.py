
def handle_buggy_time(input_time):
    if not input_time:
        return None
    elif len(input_time.split(".")) == 2:
        return input_time
    elif len(input_time.split(":")) == 3:
        return input_time + '.000'
    else:
        return input_time + ':00.000'

