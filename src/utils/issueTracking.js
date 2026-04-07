export function resolveDateValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "number") {
    const parsedFromNumber = new Date(value);
    return Number.isNaN(parsedFromNumber.getTime()) ? null : parsedFromNumber;
  }

  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  const parsedFromString = new Date(value);
  return Number.isNaN(parsedFromString.getTime()) ? null : parsedFromString;
}

export function getComparableTime(data) {
  const resolvedDate =
    resolveDateValue(data.timestamp) ??
    resolveDateValue(data.updatedAt) ??
    resolveDateValue(data.createdAt) ??
    resolveDateValue(data.reported_at);

  return resolvedDate?.getTime?.() ?? 0;
}

export function mapIssue(data) {
  return {
    id: data.id,
    tokenId: data.tokenId ?? data.claimToken ?? "Unavailable",
    timestamp:
      resolveDateValue(data.timestamp) ??
      resolveDateValue(data.updatedAt) ??
      resolveDateValue(data.createdAt) ??
      resolveDateValue(data.reported_at),
  };
}

export function selectNewestIssue(issues, mapper = mapIssue) {
  const latestIssue = [...issues].sort((leftIssue, rightIssue) => {
    const leftTime = getComparableTime(leftIssue);
    const rightTime = getComparableTime(rightIssue);
    return rightTime - leftTime;
  })[0];

  return latestIssue ? mapper(latestIssue) : null;
}
