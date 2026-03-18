from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

db = SQLAlchemy()

# rate limiter
limiter = Limiter(
    key_func=get_remote_address, default_limits=["1000 per day", "200 per hour"]
)


def create_app():
    app = Flask(__name__, static_folder="static")

    # TODO swap these defaults before deploying
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "secret_key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///meetme.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # flask security config for password hashing using bcrypt
    app.config["SECURITY_PASSWORD_SALT"] = os.getenv(
        "SECURITY_PASSWORD_SALT", "password_salt"
    )
    app.config["SECURITY_PASSWORD_HASH"] = "bcrypt"
    app.config["SECURITY_TOKEN_AUTHENTICATION_KEY"] = "auth_token"

    db.init_app(app)
    CORS(
        app,
        origins=os.getenv("CORS_ORIGINS", "*").split(","),
        supports_credentials=True,
    )
    limiter.init_app(app)

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "rate limit exceeded"}), 429

    # init flask security
    from app.models.models import User

    user_datastore = SQLAlchemyUserDatastore(db, User, None)
    security = Security(app, user_datastore)

    # register all the blueprints
    from app.routes import main
    from app.routes.location import location_bp
    from app.routes.midpoint import midpoint_bp
    from app.routes.auth import auth_bp
    from app.routes.friend import friend_bp
    from app.routes.party import party_bp
    from app.routes.venues import venues_bp
    from app.routes.questionnaire import questionare_bp as questionnaire_bp

    app.register_blueprint(main)
    app.register_blueprint(location_bp)
    app.register_blueprint(midpoint_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(friend_bp)
    app.register_blueprint(party_bp)
    app.register_blueprint(venues_bp)
    app.register_blueprint(questionnaire_bp)

    # creates tables if they dont exist yet
    with app.app_context():
        db.create_all()

    return app
