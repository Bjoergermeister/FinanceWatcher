from __future__ import annotations

import calendar

from datetime import date
from enum import IntEnum

class DateUnits(IntEnum):
    YEAR = 1
    MONTH = 2
    WEEK = 3
    DAY = 4

    @staticmethod
    def get_by_string(name: str) -> DateUnits:
        match name:
            case "YEAR": return DateUnits.YEAR
            case "MONTH": return DateUnits.MONTH
            case "WEEK": return DateUnits.WEEK
            case "DAY": return DateUnits.DAY

DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def add_to_date(current_date: date, unit: DateUnits, amount: int) -> date:
    if unit == DateUnits.YEAR:
        return date(current_date.year + amount, current_date.month, current_date.day)
    if unit == DateUnits.MONTH:
        total_months = current_date.month + amount

        years_to_add = total_months // 12
        new_months = total_months % 12

        # 12 % 12 is 0 and 12 // 12 is 1, which is both undesirable
        # So we need to make sure that Dezember is the 12th months and we don't add a year just yet
        if new_months == 0:
            years_to_add = 0
            new_months = 12

        return date(current_date.year + years_to_add, new_months, current_date.day)
    if unit == DateUnits.DAY:
        total_days = current_date.day + amount

        current_year = current_date.year
        current_month = current_date.month

        while total_days > get_days_in_month(current_month, current_year):
            total_days -= get_days_in_month(current_month, current_year)

            current_month += 1
            if current_month == 13:
                current_year += 1
                current_month = 1


        return date(current_year, current_month, total_days)

def get_days_in_month(month: int, year: int) -> int:
    if month < 1 or month > 12:
        raise ValueError("month needs to be between 1 and 12")
    
    if month == 2 and  calendar.isleap(year):
        return 29

    return DAYS_IN_MONTH[month - 1]