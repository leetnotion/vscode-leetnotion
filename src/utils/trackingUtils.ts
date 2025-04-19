import * as vscode from "vscode";
import { getLeetCodeEndpoint } from "../commands/plugin";
import { Endpoint } from "../shared";
import { leetCodeManager } from "../leetCodeManager";
import mixpanel from "mixpanel";

const MIXPANEL_TOKEN = "3306db013b2f21d4df00a4554c381c1a";

const mixpanelClient = mixpanel.init(MIXPANEL_TOKEN, {
    protocol: "https",
});

const getTimeZone = (): string => {
    const endPoint: string = getLeetCodeEndpoint();
    return endPoint === Endpoint.LeetCodeCN ? "Asia/Shanghai" : "UTC";
};

interface IReportData {
    event_key: string;
    type?: "click" | "expose" | string;
    anonymous_id?: string;
    tid?: number;
    ename?: string;
    href?: string;
    referer?: string;
    extra?: string;
    target?: string;
}

interface ITrackData {
    reportCache: IReportData[];
    isSubmit: boolean;
    report: (reportItems: IReportData | IReportData[]) => void;
    submitReport: () => Promise<void>;
}

const _charStr = "abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+=";

function RandomIndex(min: number, max: number, i: number) {
    let index = Math.floor(Math.random() * (max - min + 1) + min);
    const numStart = _charStr.length - 10;
    if (i === 0 && index >= numStart) {
        index = RandomIndex(min, max, i);
    }
    return index;
}

function getRandomString(len: number) {
    const min = 0;
    const max = _charStr.length - 1;
    let _str = "";
    for (let i = 0; i < len; i++) {
        const index = RandomIndex(min, max, i);
        _str += _charStr[index];
    }
    return _str;
}

function getAllowReportDataConfig() {
    const leetCodeConfig = vscode.workspace.getConfiguration("leetnotion");
    return !!leetCodeConfig.get<boolean>("allowReportData");
}

class TrackData implements ITrackData {
    public reportCache: IReportData[] = [];

    public isSubmit: boolean = false;

    private sendTimer: NodeJS.Timeout | undefined;

    public report = (reportItems: IReportData | IReportData[]) => {
        if (!getAllowReportDataConfig()) return;

        if (!Array.isArray(reportItems)) {
            reportItems = [reportItems];
        }

        const randomId = getRandomString(60);
        reportItems.forEach((item) => {
            this.reportCache.push({
                ...item,
                referer: "vscode",
                target: leetCodeManager.getUser() ?? "anonymous",
                anonymous_id: item.anonymous_id ?? randomId,
            });
        });

        if (this.sendTimer) clearTimeout(this.sendTimer);
        this.sendTimer = setTimeout(this.submitReport, 800);
    };

    public submitReport = async () => {
        if (!getAllowReportDataConfig()) return;

        if (!this.reportCache.length || this.isSubmit) return;

        const eventsToSend = this.reportCache;
        this.reportCache = [];

        try {
            this.isSubmit = true;
            const timezone = getTimeZone();

            for (const event of eventsToSend) {
                const distinct_id = event.target || "anonymous";
                const eventName = event.ename || event.event_key;

                mixpanelClient.track(eventName, {
                    distinct_id,
                    ...event,
                    timezone,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (err) {
            // fallback: push events back if failed
            this.reportCache = this.reportCache.concat(eventsToSend);
        } finally {
            this.isSubmit = false;
        }
    };
}

export default new TrackData();
