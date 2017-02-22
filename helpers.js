module.exports = {
    prettyDate : function(time)
    {
        var local = new Date();
        var system_date = new Date(Date.parse(time));
        var user_date = new Date(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(),  local.getUTCHours(), local.getUTCMinutes(), local.getUTCSeconds());

        var diff = Math.floor((user_date - system_date) / 1000);
        if (diff <= 1) {return "just now";}
        if (diff < 20) {return diff + " seconds ago";}
        if (diff < 40) {return "half a minute ago";}
        if (diff < 60) {return "less than a minute ago";}
        if (diff <= 90) {return "one minute ago";}
        if (diff <= 3540) {return Math.round(diff / 60) + " minutes ago";}
        if (diff <= 5400) {return "1 hour ago";}
        if (diff <= 86400) {return Math.round(diff / 3600) + " hours ago";}
        if (diff <= 129600) {return "1 day ago";}
        if (diff < (777600 * 4)) {return (Math.round(diff / 86400)) < 31 ? Math.round(diff/86400) + " days ago" : "1 month ago";}
        if (diff <= (777600 * 4)) { return "1 month ago"; }
        if (diff <= ((777600 * 4) * 2)) { return "2 months ago"; }
        if (diff <= ((777600 * 4) * 3)) { return "3 months ago"; }
        if (diff <= ((777600 * 4) * 4)) { return "4 months ago"; }
        if (diff <= ((777600 * 4) * 5)) { return "5 months ago"; }
        if (diff <= ((777600 * 4) * 6)) { return "6 months ago"; }
        if (diff <= ((777600 * 4) * 7)) { return "7 months ago"; }
        if (diff <= ((777600 * 4) * 8)) { return "8 months ago"; }
        if (diff <= ((777600 * 4) * 9)) { return "9 months ago"; }
        if (diff <= ((777600 * 4) * 10)) { return "10 months ago"; }
        if (diff <= ((777600 * 4) * 11)) { return "11 months ago"; }
        if (diff <= ((777600 * 4) * 12)) { return "1 year ago"; }
        if (diff <= ((777600 * 4) * 12) * 2) { return "2 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 3) { return "3 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 4) { return "4 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 5) { return "5 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 6) { return "6 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 7) { return "7 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 8) { return "8 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 9) { return "9 years ago"; }
        if (diff <= ((777600 * 4) * 12) * 10) { return "10 years ago"; }

        return "on " + system_date;
    },
}