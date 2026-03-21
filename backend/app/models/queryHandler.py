from sqlalchemy.orm import joinedload, subqueryload
from sqlalchemy import or_, and_
from app.models.models import (
    Friends,
    FriendStatus,
    Party,
    PartyInvite,
    PartyQuestionnaire,
)


# Party Query Handlers
def get_pending_party_invites(user_id):
    return (
        PartyInvite.query.options(
            joinedload(PartyInvite.party).joinedload(Party.host),
            joinedload(PartyInvite.party)
            .subqueryload(Party.invites)
            .joinedload(PartyInvite.invitee),
        )
        .filter_by(invitee_user_id=user_id, status="pending")
        .all()
    )


def get_party_with_members(party_id):
    return Party.query.options(
        joinedload(Party.host),
        subqueryload(Party.invites).joinedload(PartyInvite.invitee),
    ).get(party_id)


def get_active_party_for_user(user_id):
    accepted_inv = PartyInvite.query.filter_by(
        invitee_user_id=user_id, status="accepted"
    ).first()

    if accepted_inv:
        return get_party_with_members(accepted_inv.party_id)

    return (
        Party.query.options(
            joinedload(Party.host),
            subqueryload(Party.invites).joinedload(PartyInvite.invitee),
        )
        .filter_by(host_user_id=user_id)
        .first()
    )


# Friend Query Handlers
def verify_friendships(user_id, friend_ids):
    if not friend_ids:
        return set()

    friendships = Friends.query.filter(
        Friends.status == FriendStatus.accepted,
        or_(
            and_(Friends.user_id == user_id, Friends.friend_id.in_(friend_ids)),
            and_(Friends.friend_id == user_id, Friends.user_id.in_(friend_ids)),
        ),
    ).all()

    confirmed = set()
    for f in friendships:
        confirmed.add(f.friend_id if f.user_id == user_id else f.user_id)
    return confirmed


def get_accepted_friends(user_id):
    return (
        Friends.query.options(joinedload(Friends.user), joinedload(Friends.friend))
        .filter(
            ((Friends.user_id == user_id) | (Friends.friend_id == user_id))
            & (Friends.status == FriendStatus.accepted)
        )
        .all()
    )


def get_pending_friend_requests(user_id):
    return (
        Friends.query.options(joinedload(Friends.user))
        .filter_by(friend_id=user_id, status=FriendStatus.pending)
        .all()
    )


# Questionare Query Handler
def get_questionnaires_by_user(party_id):
    all_q = PartyQuestionnaire.query.filter_by(party_id=party_id).all()
    return {q.user_id: q for q in all_q}
