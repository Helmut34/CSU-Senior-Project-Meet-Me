from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

db = SQLAlchemy()
login_manager = LoginManager()

#rate limiter (remember to update b4 prod)
limiter = Limiter(
    key_func=get_remote_address, default_limits=["1000 per day", "200 per hour"]
)

def create_app():
    app = Flask(__name__, static_folder="static")

    # TODO swap these defaults before deploying
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///meetme.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    login_manager.init_app(app)
    CORS(
        app,
        origins=os.getenv("CORS_ORIGINS", "*").split(","),
        supports_credentials=True,
    )
    limiter.init_app(app)

#internal functions for login manager and error handling
    @login_manager.user_loader
    def load_user(user_id):
        from app.models.models import User
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "Authentication required"}), 401

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "rate limit exceeded"}), 429

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

    return app
