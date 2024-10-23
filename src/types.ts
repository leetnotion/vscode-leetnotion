import { LeetcodeProblem as Problem } from '@leetnotion/leetcode-api';
import type {
    DateFormulaPropertyResponse,
    NumberFormulaPropertyResponse,
    PageObjectResponse,
    QueryCheckbox,
    QueryDate,
    QueryFormula,
    QueryMultiSelect,
    QueryNumberType,
    QueryRelation,
    QueryRichText,
    QueryRollup,
    QuerySelect,
    QueryTitle,
    QueryUrl,
    StringFormulaPropertyResponse,
    TextRichTextItemResponse,
    MutationCheckbox,
    MutationMultiSelect,
    MutationNumberType,
    MutationRelation,
    MutationRichText,
    MutationSelect,
    MutationTitle,
    MutationUrl,
    PrimaryColor,
} from '@leetnotion/notion-api';

export interface LeetcodeSubmission {
    code: string;
    compare_result: string;
    flag_type: number;
    has_notes: boolean;
    id: number;
    is_pending: string;
    lang: string;
    lang_name: string;
    memory: string;
    question_id: number;
    runtime: string;
    status: number;
    status_display: string;
    time: string;
    timestamp: number;
    title: string;
    title_slug: string;
    url: string;
}

export type PartialProblemPage = {
    id: string;
    'Question Number': QueryNumberType;
    'Company Tags': QueryMultiSelect;
    Frequency: QueryNumberType;
    Slug: QueryRichText;
};

export type LeetcodeProblem = { type: string[] } & Problem;

export type Mapping = Record<string, string>;

export type CreateProblemPageProperties = {
    Name: MutationTitle;
    Difficulty: ProblemDifficulty;
    'Question Tags': MutationMultiSelect;
    'Company Tags'?: MutationMultiSelect;
    Slug: MutationRichText;
    URL: MutationUrl;
    Frequency?: MutationNumberType;
    'Question Number': MutationNumberType;
    Solution: MutationUrl;
    'Free or Paid': FreeOrPaid;
    'Solution Free or Paid': FreeOrPaid;
    'Video Solution': MutationCheckbox;
    Likes: MutationNumberType;
    Dislikes: MutationNumberType;
    'Total Submissions': MutationNumberType;
    'Total Accepted': MutationNumberType;
    Type: MutationMultiSelect;
    'Similar Questions'?: MutationRelation;
};

export type UpdateProblemPageProperties = CreateProblemPageProperties & {
    'Similar Questions': MutationRelation;
};

export type QueryProblemPageProperties = {
    Name: QueryTitle<TextRichTextItemResponse>;
    Favourite: QueryCheckbox;
    Status: QueryCheckbox;
    Difficulty: QuerySelect;
    'Question Tags': QueryMultiSelect;
    'Company Tags': QueryMultiSelect;
    Lists: QueryMultiSelect;
    Tags: QueryMultiSelect;
    'Review Date': QueryDate;
    Reviewed: QueryCheckbox;
    URL: QueryUrl;
    Accuracy: QueryFormula<NumberFormulaPropertyResponse>;
    Frequency: QueryNumberType;
    'Similar Questions': QueryRelation;
    Note: QueryRichText<TextRichTextItemResponse>;
    'Question Number': QueryNumberType;
    Sorter: QueryFormula<NumberFormulaPropertyResponse>;
    Solution: QueryUrl;
    'Free or Paid': QuerySelect;
    'Solution Free or Paid': QuerySelect;
    'Video Solution': QueryCheckbox;
    Sublists: QueryMultiSelect;
    Likes: QueryNumberType;
    Dislikes: QueryNumberType;
    'Total Submissions': QueryNumberType;
    'Total Accepted': QueryNumberType;
    'No of Company Tags': QueryFormula<NumberFormulaPropertyResponse>;
    'No of Lists': QueryFormula<NumberFormulaPropertyResponse>;
    'No of Question Tags': QueryFormula<NumberFormulaPropertyResponse>;
    Slug: QueryRichText<TextRichTextItemResponse>;
    Submissions: QueryRelation;
    Progress: QueryRelation;
    'First Submitted Date': QueryRollup;
    'Last Submitted Date': QueryRollup;
    'First Submitted': QueryFormula<DateFormulaPropertyResponse>;
    'Last Submitted': QueryFormula<DateFormulaPropertyResponse>;
    'Review Status': QueryFormula<StringFormulaPropertyResponse>;
    Type: QueryMultiSelect;
};

export type ProblemPageResponse = PageObjectResponse<QueryProblemPageProperties>;

export interface SimilarQuestionProperties {
    'Similar Questions': MutationRelation;
}

export interface SheetProperties {
    Lists: MutationMultiSelect;
    Sublists: MutationMultiSelect;
}

export interface FreeOrPaid extends MutationSelect {
    select: {
        name: 'Free' | 'Paid' | 'Not available';
    };
}

export interface ProblemDifficulty extends MutationSelect {
    select: {
        name: 'Easy' | 'Medium' | 'Hard';
    };
}

export type TopicTags = Record<string, string[]>
export type Sheets = Record<string, Record<string, string[]>>;
export type CompanyTags = Record<string, string[]>;
export type SubmissionPageDetails = {
    submissionId: number,
    submissionPageId: string,
    lang: string
}

export type WebviewMessage = {
    command: string;
    questionPageId: string;
    submissionPageId: string;
    tags: string;
}

export type SetPropertiesMessage = {
    command: string;
    questionPageId: string;
    submissionPageId: string;
    notes: string;
    reviewDate: string;
    isOptimal: boolean;
    initialTags: string[];
    finalTags: string[]
}

export type SelectTags = {
    id: number;
    text: string;
    selected: boolean;
}[]

export type MultiSelectDatabasePropertyConfigResponse = {
    type: "multi_select";
    multi_select: {
        options: Array<SelectPropertyResponse>;
    };
    id: string;
    name: string;
    description: string | null;
};

export type SelectPropertyResponse = {
    id: string;
    name: string;
    color: PrimaryColor;
    description: string | null;
};

export type PendingSessionDetails = {
    id: string;
    createdTime: Date;
};

export type SessionDetails = {
    isProblemsRetrieved: boolean;
    updatedPages: Record<string, string>;
    leetcodeProblems: LeetcodeProblem[];
};
