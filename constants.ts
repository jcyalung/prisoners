export const COOPERATE = "C";
export const DEFECT = "D";
export const SCORING : Record<string, number[]> = {
    "CC": [3,3],
    "DC": [5,1],
    "CD": [1,5],
    "DD": [1,1],
}

export const DIAMOND_MAPPING = {
    "": 0,
    "CC" : 1,
    "DC" : 2,
    "CD" : 3,
    "DD" : 4,
}